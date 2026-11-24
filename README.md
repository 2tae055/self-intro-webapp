# 자기소개 웹앱 (Cloud Database 과제)

클라우드와 데이터베이스를 공부하는 대학생을 소개하는 **서버리스 원페이지 웹앱**입니다.
기획서(자기소개 웹앱 개발 기획서)의 화면 명세와 기능 명세를 그대로 구현했습니다.

## 화면 구성 (원페이지)
| ID | 섹션 | 내용 |
|---|---|---|
| S01 | Home | 이름 · 한 줄 소개 · 프로필 사진 · 고정 내비게이션 · “프로젝트 보기” |
| S02 | 소개 | 학교 · 전공 · 자기소개 · 기술 스택 배지 · 학업/활동 타임라인 |
| S03 | 프로젝트 | 카드 목록(최대 6개, 최신순) · “자세히 보기” 상세 모달 |
| S04 | 연락처 | 이메일(mailto) · 주소 복사 · GitHub / 블로그 링크 |
| S05 | 방명록 | 작성 폼(닉네임 1~10자, 메시지 1~200자) · 최신순 10개 · 더 보기 |

## 아키텍처
```
방문자 ──HTTPS──▶ CloudFront ──OAC──▶ S3 (비공개, 정적 파일)
   └──GraphQL──▶ AppSync ──리졸버──▶ DynamoDB (Projects, Guestbook)   ← 다음 주차
```
- S3: 퍼블릭 액세스 차단, CloudFront(OAC)를 통해서만 읽기
- CloudFront: HTTPS 리다이렉트, 기본 루트 `index.html`
- AppSync/DynamoDB 연결 전에는 `js/data.js` 예시 데이터 + 브라우저 저장소로 동작
  (`js/config.js`에 AppSync URL·API Key를 넣으면 자동 전환, 스키마는 `backend/schema.graphql`)

## 폴더
```
index.html          화면 (S01~S05)
css/style.css       스타일 (반응형 · 다크 모드)
js/data.js          ✏️ 내 정보 · 프로젝트 데이터
js/config.js        AppSync 연결 설정
js/api.js           데이터 계층 (AppSync ↔ 로컬)
js/app.js           화면 동작 (모달 · 방명록 검사/등록/조회)
backend/            AppSync GraphQL 스키마
deploy/setup.ps1    S3 + OAC + CloudFront + 버킷 정책 생성
deploy/update.ps1   수정 후 재배포 + 캐시 무효화
```

## 로컬 실행
```bash
python -m http.server 5500
```

## 배포
```bash
powershell -ExecutionPolicy Bypass -File deploy/setup.ps1 -BucketName <고유한-버킷이름>
powershell -ExecutionPolicy Bypass -File deploy/update.ps1
```
