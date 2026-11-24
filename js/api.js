// 데이터 계층: AppSync(GraphQL)가 설정돼 있으면 사용하고, 없으면 로컬 예시 데이터로 동작
(function () {
  const cfg = window.APP_CONFIG || {};
  const useAppSync = Boolean(cfg.appsyncUrl && cfg.appsyncApiKey);
  const LS_KEY = 'guestbook.local.v1';

  async function gql(query, variables) {
    const res = await fetch(cfg.appsyncUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': cfg.appsyncApiKey },
      body: JSON.stringify({ query, variables })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (json.errors && json.errors.length) throw new Error(json.errors[0].message);
    return json.data;
  }

  // ---- 로컬 모드 (AppSync 연결 전) ----
  function readLocal() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
  }
  function writeLocal(items) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch { /* 저장 불가 환경 */ }
  }
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  window.API = {
    mode: useAppSync ? 'appsync' : 'local',

    // 기능3: 카드 목록 (최대 6개, 시작일 최신순)
    async listProjects() {
      let items;
      if (useAppSync) {
        const d = await gql(`query { listProjects { items { id title period startDate stack thumbnail githubUrl } } }`);
        items = d.listProjects.items;
      } else {
        items = window.SAMPLE_PROJECTS;
      }
      return [...items].sort((a, b) => (b.startDate || '').localeCompare(a.startDate || '')).slice(0, 6);
    },

    // 기능3: 상세 (getProject → DynamoDB GetItem)
    async getProject(id) {
      if (useAppSync) {
        const d = await gql(`query ($id: ID!) { getProject(id: $id) { id title period role stack description result githubUrl thumbnail } }`, { id });
        return d.getProject;
      }
      return window.SAMPLE_PROJECTS.find(p => p.id === id);
    },

    // 기능2: 방명록 조회 (10개씩, createdAt 최신순, nextToken)
    async listGuestbook(limit = 10, nextToken = null) {
      if (useAppSync) {
        const d = await gql(`query ($limit: Int, $nextToken: String) {
          listGuestbook(limit: $limit, nextToken: $nextToken) { items { id nickname message createdAt } nextToken } }`, { limit, nextToken });
        return d.listGuestbook;
      }
      await wait(150);
      const all = readLocal().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const start = nextToken ? Number(nextToken) : 0;
      const items = all.slice(start, start + limit);
      const next = start + limit < all.length ? String(start + limit) : null;
      return { items, nextToken: next };
    },

    // 기능1: 방명록 작성 (createGuestbook → DynamoDB PutItem)
    async createGuestbook(nickname, message) {
      if (useAppSync) {
        const d = await gql(`mutation ($nickname: String!, $message: String!) {
          createGuestbook(nickname: $nickname, message: $message) { id nickname message createdAt } }`, { nickname, message });
        return d.createGuestbook;
      }
      await wait(300);
      const item = {
        id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
        nickname, message, createdAt: new Date().toISOString()
      };
      const all = readLocal(); all.push(item); writeLocal(all);
      return item;
    }
  };
})();
