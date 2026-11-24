// 사이트 설정
// AppSync를 만든 뒤(다음 주차) 아래 두 값을 채우면 프로젝트·방명록이 DynamoDB와 연결됩니다.
// 비워 두면 js/data.js의 예시 데이터 + 브라우저 저장소(localStorage)로 동작합니다.
window.APP_CONFIG = {
  appsyncUrl: '',   // 예: https://xxxxxxxx.appsync-api.ap-northeast-2.amazonaws.com/graphql
  appsyncApiKey: '' // 예: da2-xxxxxxxxxxxxxxxxxxxxxxxx
};
