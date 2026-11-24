// ✏️ 내 정보는 이 파일만 고치면 사이트 전체에 반영됩니다. (○○○ 부분을 바꾸세요)
window.PROFILE = {
  name: '○○○',
  role: 'Cloud & Database Developer',
  headline: '데이터로 서비스를 만드는 개발자',
  summary: '클라우드와 데이터베이스를 공부하며, 직접 설계하고 AWS에 배포까지 해 보는 개발자를 목표로 하고 있습니다.',
  facts: [
    ['학교', '○○대학교'],
    ['전공', '○○학과 (○학년)'],
    ['관심 분야', '클라우드 · 데이터베이스 · 백엔드']
  ],
  about: [
    '사용자가 실제로 쓰는 서비스를 만들고, 그 서비스를 안정적으로 운영하는 일에 관심이 많습니다.',
    '이 사이트도 S3 + CloudFront로 배포하고, 방명록과 프로젝트 데이터는 AppSync + DynamoDB로 관리하도록 직접 설계했습니다.',
    '앞으로는 데이터 모델링과 서버리스 아키텍처를 더 깊이 공부하는 것이 목표입니다.'
  ],
  stack: ['HTML/CSS', 'JavaScript', 'AWS S3', 'CloudFront', 'AppSync', 'DynamoDB', 'PostgreSQL', 'Git'],
  timeline: [
    ['2026', '클라우드 데이터베이스 기초 수강 · 자기소개 웹앱 개발'],
    ['2025', '데이터베이스 · 자료구조 수강'],
    ['20○○', '○○대학교 ○○학과 입학']
  ],
  email: 'your.email@example.com',
  links: [
    ['GitHub', 'https://github.com/'],
    ['기술 블로그', 'https://velog.io/']
  ]
};

// 프로젝트 예시 데이터 (AppSync 연결 전 사용). 필드는 DynamoDB Projects 테이블과 동일.
window.SAMPLE_PROJECTS = [
  {
    id: 'p3', title: '자기소개 웹앱', period: '2026.09 ~ 2026.12', startDate: '2026-09-01',
    role: '기획 · 프론트엔드 · AWS 인프라 구성 (개인)',
    stack: ['HTML/CSS', 'JavaScript', 'S3', 'CloudFront', 'AppSync', 'DynamoDB'],
    description: '원페이지 자기소개 사이트를 서버리스로 구축. S3 정적 호스팅을 CloudFront(OAC)로만 노출하고, 방명록·프로젝트 데이터는 AppSync GraphQL API와 DynamoDB로 관리.',
    result: '서버 없이 HTTPS 배포와 데이터 저장을 구현했고, 정적 호스팅과 API 계층을 분리하는 구조를 익혔습니다.',
    githubUrl: 'https://github.com/', thumbnail: ''
  },
  {
    id: 'p2', title: '동네 도서관 대출 DB', period: '2026.05 ~ 2026.06', startDate: '2026-05-01',
    role: '데이터 모델링 · SQL 작성 (개인)',
    stack: ['PostgreSQL', 'pgAdmin', 'ERD'],
    description: '회원·도서·대출을 개념 → 논리 → 물리 모델로 설계하고 PostgreSQL로 구현. FK·UNIQUE·CHECK 제약과 미반납 대출용 부분 인덱스를 적용.',
    result: '제약 조건으로 잘못된 데이터 입력을 DB 단에서 막는 방법과 인덱스 설계를 익혔습니다.',
    githubUrl: '', thumbnail: ''
  },
  {
    id: 'p1', title: '커피 영수증 정규화 실습', period: '2026.03 ~ 2026.04', startDate: '2026-03-01',
    role: '테이블 설계 · 정규화 (팀 3인 중 설계 담당)',
    stack: ['SQLite', 'Colab', '정규화'],
    description: '실제 영수증을 매장·주문·메뉴·주문상세·결제 5개 테이블로 분해하고, 합계·부가세는 저장하지 않고 계산하도록 설계.',
    result: 'JOIN으로 영수증을 그대로 복원해 무손실 분해를 검증했습니다.',
    githubUrl: '', thumbnail: ''
  }
];
