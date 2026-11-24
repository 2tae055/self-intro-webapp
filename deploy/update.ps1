# 사이트를 고친 뒤 다시 배포: S3에 변경 파일 업로드 + CloudFront 캐시 무효화
# 사용법:  powershell -ExecutionPolicy Bypass -File deploy\update.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$s = Get-Content (Join-Path $PSScriptRoot 'out\state.json') -Raw | ConvertFrom-Json
aws s3 cp (Join-Path $root 'index.html') "s3://$($s.bucket)/index.html" --content-type 'text/html; charset=utf-8'
foreach ($d in 'css', 'js', 'assets') { aws s3 sync (Join-Path $root $d) "s3://$($s.bucket)/$d" --delete }
aws cloudfront create-invalidation --distribution-id $s.distributionId --paths '/*' --query 'Invalidation.Id' --output text
Write-Host "배포 완료 → https://$($s.domain)  (캐시 무효화 1~2분)"
