(function () {
  const P = window.PROFILE;
  const $ = (s) => document.querySelector(s);
  // XSS 방지: 사용자/데이터 값은 항상 textContent로 넣는다
  function el(tag, attrs = {}, ...children) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v; else n.setAttribute(k, v);
    }
    for (const c of children) if (c != null) n.append(c);
    return n;
  }

  /* ---------- S01 · S02 · S04 : 프로필 ---------- */
  document.querySelectorAll('[data-bind]').forEach(n => { const v = P[n.dataset.bind]; if (v) n.textContent = v; });
  document.title = `자기소개 | ${P.name}`;
  $('#year').textContent = new Date().getFullYear();
  P.facts.forEach(([k, v]) => $('#facts').append(el('dt', { text: k }), el('dd', { text: v })));
  P.about.forEach(t => $('#about-text').append(el('p', { text: t })));
  P.stack.forEach(t => $('#stack').append(el('li', { text: t })));
  P.timeline.forEach(([y, t]) => $('#timeline').append(el('li', {}, el('time', { text: y }), t)));
  $('#email-text').textContent = P.email;
  $('#email-link').href = 'mailto:' + P.email;
  P.links.forEach(([label, url]) => $('#contact-links').append(
    el('a', { class: 'btn btn-ghost', href: url, target: '_blank', rel: 'noopener', text: label + ' ↗' })));
  $('#copy-email').addEventListener('click', async (e) => {
    try { await navigator.clipboard.writeText(P.email); e.target.textContent = '복사됨 ✓'; }
    catch { e.target.textContent = '복사 실패'; }
    setTimeout(() => (e.target.textContent = '주소 복사'), 1500);
  });

  // 내비게이션: 스크롤 시 테두리 + 현재 섹션 표시
  const nav = $('#nav');
  const links = [...document.querySelectorAll('.nav-links a')];
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 8), { passive: true });
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section').forEach(s => io.observe(s));

  /* ---------- S03 프로젝트 + 기능3 상세 모달 ---------- */
  const grid = $('#project-grid');
  const modal = $('#modal');
  let lastFocus = null;

  async function renderProjects() {
    try {
      const items = await API.listProjects();
      grid.replaceChildren();
      if (!items.length) { grid.append(el('p', { class: 'muted', text: '등록된 프로젝트가 없습니다.' })); return; }
      items.forEach(p => {
        const thumb = el('div', { class: 'project-thumb' });
        if (p.thumbnail) thumb.append(el('img', { src: p.thumbnail, alt: '', loading: 'lazy' }));
        else thumb.textContent = p.title;
        const tags = el('ul', { class: 'tags' }, ...(p.stack || []).map(t => el('li', { text: t })));
        const btn = el('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: '자세히 보기' });
        btn.addEventListener('click', () => openProject(p.id));
        grid.append(el('article', { class: 'card project-card' }, thumb,
          el('div', { class: 'project-body' }, el('h3', { text: p.title }), el('p', { class: 'period', text: p.period }), tags, btn)));
      });
    } catch (err) {
      grid.replaceChildren(el('p', { class: 'muted', text: '프로젝트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' }));
      console.error(err);
    }
  }

  async function openProject(id) {
    lastFocus = document.activeElement;
    const p = await API.getProject(id);
    if (!p) return;
    const rows = [['기간', p.period], ['담당 역할', p.role], ['사용 기술', (p.stack || []).join(', ')], ['구현 내용', p.description], ['결과 · 배운 점', p.result]];
    const dl = el('dl', { class: 'detail' });
    rows.forEach(([k, v]) => dl.append(el('dt', { text: k }), el('dd', { text: v || '-' })));
    const body = $('#modal-body');
    body.replaceChildren(el('h3', { id: 'modal-title', text: p.title }), dl);
    if (p.githubUrl) body.append(el('a', { class: 'btn btn-primary', href: p.githubUrl, target: '_blank', rel: 'noopener', text: 'GitHub에서 보기 ↗' }));
    modal.hidden = false;
    document.body.classList.add('modal-open');
    modal.querySelector('.modal-close').focus();
  }
  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open'); // 스크롤 위치는 그대로 유지
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* ---------- S05 방명록 : 기능1 작성 · 기능2 조회 ---------- */
  const form = $('#gb-form'), nick = $('#gb-nickname'), msg = $('#gb-message');
  const submitBtn = $('#gb-submit'), status = $('#gb-status'), list = $('#gb-list');
  const moreBtn = $('#gb-more'), empty = $('#gb-empty');
  let nextToken = null;

  const fmt = (iso) => {
    const d = new Date(iso), z = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${z(d.getMonth() + 1)}.${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
  };
  function gbItem(it, isNew) {
    return el('li', { class: 'gb-item' + (isNew ? ' new' : '') },
      el('div', { class: 'gb-head' }, el('strong', { text: it.nickname }), el('time', { datetime: it.createdAt, text: fmt(it.createdAt) })),
      el('p', { text: it.message }));
  }
  async function loadGuestbook(append) {
    moreBtn.disabled = true;
    try {
      const res = await API.listGuestbook(10, append ? nextToken : null);
      if (!append) list.replaceChildren();
      res.items.forEach(it => list.append(gbItem(it)));
      nextToken = res.nextToken;
      moreBtn.hidden = !nextToken;
      empty.hidden = list.children.length > 0;
    } catch (err) {
      empty.hidden = false; empty.textContent = '방명록을 불러오지 못했습니다.'; console.error(err);
    } finally { moreBtn.disabled = false; }
  }
  moreBtn.addEventListener('click', () => loadGuestbook(true));

  msg.addEventListener('input', () => { $('#gb-count').textContent = msg.value.length; });

  function setError(input, errEl, text) {
    input.closest('.field').classList.toggle('invalid', Boolean(text));
    $(errEl).textContent = text || '';
  }
  function validate() {
    const n = nick.value.trim(), m = msg.value.trim();
    let ok = true;
    if (!n) { setError(nick, '#err-nickname', '닉네임을 입력해 주세요.'); ok = false; }
    else if (n.length > 10) { setError(nick, '#err-nickname', '닉네임은 10자 이하로 입력해 주세요.'); ok = false; }
    else setError(nick, '#err-nickname');
    if (!m) { setError(msg, '#err-message', '메시지를 입력해 주세요.'); ok = false; }
    else if (m.length > 200) { setError(msg, '#err-message', '메시지는 200자 이하로 입력해 주세요.'); ok = false; }
    else setError(msg, '#err-message');
    return ok ? { n, m } : null;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = ''; status.className = 'form-status';
    const v = validate();
    if (!v) return;
    submitBtn.disabled = true; submitBtn.textContent = '등록 중…'; // 중복 전송 방지
    try {
      const item = await API.createGuestbook(v.n, v.m);
      form.reset(); $('#gb-count').textContent = '0';
      list.prepend(gbItem(item, true));
      empty.hidden = true;
      status.textContent = '방명록이 등록되었습니다.'; status.classList.add('ok');
    } catch (err) {
      status.textContent = '잠시 후 다시 시도해 주세요.'; status.classList.add('fail'); // 입력 내용은 유지
      console.error(err);
    } finally {
      submitBtn.disabled = false; submitBtn.textContent = '등록';
    }
  });

  renderProjects();
  loadGuestbook(false);
})();
