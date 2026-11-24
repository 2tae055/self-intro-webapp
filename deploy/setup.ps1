# S3(퍼블릭 액세스 차단) + CloudFront(OAC) + 버킷 정책을 한 번에 만드는 스크립트
# 사용법:  powershell -ExecutionPolicy Bypass -File deploy\setup.ps1 -BucketName <고유한-버킷이름>
param(
  [Parameter(Mandatory = $true)][string]$BucketName,
  [string]$Region = 'ap-northeast-2'
)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$out = Join-Path $PSScriptRoot 'out'
New-Item -ItemType Directory -Force $out | Out-Null
function Save-Json($name, $obj) { $p = Join-Path $out $name; ($obj | ConvertTo-Json -Depth 20) | Out-File -Encoding ascii $p; return "file://$p" }
function Invoke-Aws { $r = & aws.exe @args; if ($LASTEXITCODE -ne 0) { throw "aws $($args -join ' ') 실패" }; return $r }

$account = (Invoke-Aws sts get-caller-identity --query Account --output text).Trim()
Write-Host "▶ 계정 $account / 리전 $Region / 버킷 $BucketName"

# 1) S3 버킷 생성 + 퍼블릭 액세스 차단 유지
& aws.exe s3api head-bucket --bucket $BucketName 2>$null; if ($LASTEXITCODE -ne 0) { Invoke-Aws s3api create-bucket --bucket $BucketName --region $Region --create-bucket-configuration LocationConstraint=$Region | Out-Null }
Invoke-Aws s3api put-public-access-block --bucket $BucketName --public-access-block-configuration 'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true'
Write-Host '✔ S3 버킷 생성, 퍼블릭 액세스 차단(4개 모두 ON)'

# 2) 웹사이트 파일 업로드 (배포에 필요한 파일만)
Invoke-Aws s3 cp (Join-Path $root 'index.html') "s3://$BucketName/index.html" --content-type 'text/html; charset=utf-8' | Out-Null
foreach ($d in 'css', 'js', 'assets') { Invoke-Aws s3 sync (Join-Path $root $d) "s3://$BucketName/$d" --delete | Out-Null }
Write-Host '✔ 웹사이트 파일 업로드'

# 3) OAC 생성
$oacCfg = Save-Json 'oac.json' @{ Name = "$BucketName-oac"; Description = 'self-intro OAC'; SigningProtocol = 'sigv4'; SigningBehavior = 'always'; OriginAccessControlOriginType = 's3' }
$oacId = (Invoke-Aws cloudfront create-origin-access-control --origin-access-control-config $oacCfg --query 'OriginAccessControl.Id' --output text).Trim()
Write-Host "✔ OAC 생성: $oacId"

# 4) CloudFront 배포 생성 (S3 REST 엔드포인트 + OAC, HTTPS 리다이렉트, 기본 루트 index.html)
$originId = "s3-$BucketName"
$dist = @{
  CallerReference   = [guid]::NewGuid().ToString()
  Comment           = 'self-intro webapp'
  Enabled           = $true
  DefaultRootObject = 'index.html'
  PriceClass        = 'PriceClass_200'
  HttpVersion       = 'http2and3'
  Origins           = @{ Quantity = 1; Items = @(@{
        Id = $originId; DomainName = "$BucketName.s3.$Region.amazonaws.com"
        S3OriginConfig = @{ OriginAccessIdentity = '' }; OriginAccessControlId = $oacId }) }
  DefaultCacheBehavior = @{
    TargetOriginId = $originId; ViewerProtocolPolicy = 'redirect-to-https'; Compress = $true
    CachePolicyId  = '658327ea-f89d-4fab-a63d-7e88639e58f6'   # Managed-CachingOptimized
    AllowedMethods = @{ Quantity = 2; Items = @('GET', 'HEAD'); CachedMethods = @{ Quantity = 2; Items = @('GET', 'HEAD') } }
  }
  CustomErrorResponses = @{ Quantity = 1; Items = @(@{ ErrorCode = 403; ResponseCode = '200'; ResponsePagePath = '/index.html'; ErrorCachingMinTTL = 10 }) }
}
$distCfg = Save-Json 'distribution.json' $dist
$res = ((Invoke-Aws cloudfront create-distribution --distribution-config $distCfg --output json) -join "`n") | ConvertFrom-Json
$distId = $res.Distribution.Id; $domain = $res.Distribution.DomainName
Write-Host "✔ CloudFront 배포 생성: $distId ($domain)"

# 5) 버킷 정책: 이 배포(OAC)만 s3:GetObject 허용
$policy = @{
  Version = '2012-10-17'
  Statement = @(@{
      Sid = 'AllowCloudFrontServicePrincipalReadOnly'; Effect = 'Allow'
      Principal = @{ Service = 'cloudfront.amazonaws.com' }
      Action = 's3:GetObject'; Resource = "arn:aws:s3:::$BucketName/*"
      Condition = @{ StringEquals = @{ 'AWS:SourceArn' = "arn:aws:cloudfront::${account}:distribution/$distId" } } })
}
$polFile = Save-Json 'bucket-policy.json' $policy
Invoke-Aws s3api put-bucket-policy --bucket $BucketName --policy $polFile
Write-Host '✔ 버킷 정책 적용 (CloudFront 서비스 + SourceArn 조건)'

@{ bucket = $BucketName; region = $Region; distributionId = $distId; domain = $domain; oacId = $oacId } |
  ConvertTo-Json | Out-File -Encoding utf8 (Join-Path $out 'state.json')

Write-Host '… 배포가 전 세계 엣지에 퍼질 때까지 기다리는 중 (보통 3~10분)'
Invoke-Aws cloudfront wait distribution-deployed --id $distId
Write-Host "`n🎉 완료"
Write-Host "  CloudFront URL : https://$domain"
Write-Host "  S3 직접 URL     : https://$BucketName.s3.$Region.amazonaws.com/index.html  (AccessDenied가 정상)"
