export function renderApp(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Algorithm Guessr</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: "Inter", "SF Pro Display", "Segoe UI", sans-serif;
        background-color: #0b1120;
      }
      body {
        margin: 0;
        padding: 0;
        background: radial-gradient(circle at top, #1e293b, #0b1120 55%);
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        color: #e2e8f0;
      }
      a {
        color: #38bdf8;
      }
      a:hover {
        color: #67e8f9;
      }
      .page {
        width: min(1100px, 95vw);
        margin: 3rem auto;
        background: rgba(15, 23, 42, 0.92);
        border-radius: 24px;
        box-shadow: 0 20px 45px rgba(2, 6, 23, 0.7);
        overflow: hidden;
        backdrop-filter: blur(12px);
        border: 1px solid rgba(71, 85, 105, 0.5);
      }
      header {
        padding: 2.5rem 3rem 2rem;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.65), rgba(14, 165, 233, 0.85));
        color: #0f172a;
      }
      header h1 {
        margin: 0 0 0.5rem;
        font-size: 2.4rem;
        letter-spacing: -0.03em;
        color: #e2e8f0;
      }
      header p {
        margin: 0;
        color: rgba(226, 232, 240, 0.8);
      }
      main {
        padding: 2.5rem 3rem 3rem;
        display: grid;
        gap: 2.5rem;
      }
      section {
        background: rgba(11, 22, 40, 0.75);
        padding: 2rem;
        border-radius: 20px;
        border: 1px solid rgba(94, 106, 123, 0.4);
      }
      h2 {
        margin-top: 0;
        font-size: 1.4rem;
        color: #f1f5f9;
      }
      form {
        display: grid;
        gap: 1rem;
      }
      label {
        display: grid;
        gap: 0.35rem;
        font-size: 0.95rem;
        color: #cbd5f5;
      }
      input,
      select,
      button,
      textarea {
        font: inherit;
      }
      input,
      select,
      textarea {
        padding: 0.75rem 1rem;
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.3);
        background: rgba(15, 23, 42, 0.75);
        color: #e2e8f0;
        transition: border 150ms ease, box-shadow 150ms ease, background 150ms ease;
      }
      input::placeholder,
      textarea::placeholder {
        color: rgba(148, 163, 184, 0.6);
      }
      input:focus,
      select:focus,
      textarea:focus {
        outline: none;
        border-color: rgba(56, 189, 248, 0.8);
        box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.2);
        background: rgba(15, 23, 42, 0.9);
      }
      button {
        padding: 0.85rem 1.4rem;
        border-radius: 14px;
        border: none;
        background: linear-gradient(135deg, #38bdf8, #6366f1);
        color: #0b1120;
        font-weight: 600;
        cursor: pointer;
        transition: transform 150ms ease, box-shadow 150ms ease, opacity 150ms ease;
        justify-self: start;
      }
      button.secondary {
        background: rgba(15, 118, 110, 0.25);
        color: #5eead4;
      }
      button:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 25px rgba(15, 118, 110, 0.45);
      }
      button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
      .grid-two {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .problem-card {
        display: grid;
        gap: 1.25rem;
      }
      .problem-card header {
        padding: 0;
        background: none;
        color: inherit;
      }
      .problem-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        font-size: 0.9rem;
        color: rgba(203, 213, 225, 0.75);
      }
      .problem-statement {
        background: rgba(15, 23, 42, 0.85);
        border-radius: 16px;
        padding: 1.5rem;
        border: 1px solid rgba(71, 85, 105, 0.45);
        max-height: 420px;
        overflow: auto;
      }
      .tag-options {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .tag-option {
        padding: 0.5rem 1rem;
        border-radius: 999px;
        border: 1px solid rgba(148, 163, 184, 0.4);
        background: rgba(30, 41, 59, 0.7);
        color: #e2e8f0;
        cursor: pointer;
        transition: background 150ms ease, color 150ms ease, border 150ms ease, transform 150ms ease;
      }
      .tag-option.selected {
        background: rgba(99, 102, 241, 0.25);
        border-color: rgba(129, 140, 248, 0.8);
        color: #c7d2fe;
        transform: translateY(-1px);
      }
      .tag-option.correct {
        background: rgba(34, 197, 94, 0.25);
        border-color: rgba(74, 222, 128, 0.8);
        color: #bbf7d0;
      }
      .tag-option.incorrect {
        background: rgba(248, 113, 113, 0.25);
        border-color: rgba(248, 113, 113, 0.7);
        color: #fecaca;
      }
      .message {
        font-weight: 600;
        padding: 0.75rem 1rem;
        border-radius: 12px;
        background: rgba(59, 130, 246, 0.12);
        border: 1px solid rgba(37, 99, 235, 0.35);
        color: #bfdbfe;
      }
      .message.error {
        background: rgba(248, 113, 113, 0.15);
        border-color: rgba(239, 68, 68, 0.45);
        color: #fecaca;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        color: #e2e8f0;
      }
      th,
      td {
        text-align: left;
        padding: 0.75rem 0.5rem;
        border-bottom: 1px solid rgba(71, 85, 105, 0.35);
      }
      .hidden {
        display: none !important;
      }
      @media (max-width: 768px) {
        header {
          padding: 2rem 1.75rem 1.5rem;
        }
        main {
          padding: 2rem 1.75rem 2.5rem;
        }
        section {
          padding: 1.5rem;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header>
        <h1>Algorithm Guessr</h1>
        <p>随机挑战 Codeforces 题目，识别算法标签，赢取积分！</p>
      </header>
      <main>
        <section id="auth-section">
          <h2>账户</h2>
          <div class="grid-two">
            <form id="login-form" method="post" action=".">
              <h3>登录</h3>
              <input type="hidden" name="_action" value="login" />
              <label>用户名<input name="username" autocomplete="username" required /></label>
              <label>密码<input type="password" name="password" autocomplete="current-password" required /></label>
              <button type="submit">登录</button>
              <p id="login-error" class="message error hidden"></p>
            </form>
            <form id="register-form" method="post" action=".">
              <h3>注册</h3>
              <input type="hidden" name="_action" value="register" />
              <label>用户名<input name="username" autocomplete="username" required minlength="3" maxlength="32" /></label>
              <label>密码<input type="password" name="password" autocomplete="new-password" required minlength="6" maxlength="64" /></label>
              <button type="submit">注册</button>
              <p id="register-error" class="message error hidden"></p>
              <p id="register-closed" class="message hidden">注册暂未开放，请稍后再来或联系管理员。</p>
            </form>
          </div>
        </section>

        <section id="user-section" class="hidden">
          <div class="grid-two" style="align-items: center;">
            <div>
              <h2>你好，<span id="user-name"></span> 👋</h2>
              <p>当前积分：<strong id="user-score">0</strong></p>
              <p id="user-status"></p>
            </div>
            <div style="justify-self: end; display: flex; gap: 0.75rem;">
              <button id="logout-btn" class="secondary">退出登录</button>
              <button id="refresh-problem" class="secondary">刷新题目</button>
            </div>
          </div>
          <div id="admin-panel" class="hidden" style="margin-top: 1.5rem;">
            <h3>管理员控制台</h3>
            <div class="grid-two">
              <form id="admin-register-form" method="post" action=".">
                <label>用户名<input name="username" required /></label>
                <label>密码<input type="password" name="password" required /></label>
                <button type="submit">后台注册用户</button>
              </form>
              <form id="admin-ban-form" method="post" action=".">
                <label>用户名<input name="username" required /></label>
                <div style="display:flex; gap:0.75rem;">
                  <button type="submit">封禁用户</button>
                  <button type="button" id="admin-unban-btn" class="secondary">解封用户</button>
                </div>
              </form>
            </div>
            <div style="margin-top:1rem; display:flex; gap:1rem; align-items:center;">
              <button id="toggle-registration" class="secondary"></button>
              <span id="registration-state"></span>
            </div>
            <div style="margin-top:1.5rem;">
              <h4>用户列表</h4>
              <table>
                <thead>
                  <tr><th>用户名</th><th>积分</th><th>角色</th><th>状态</th></tr>
                </thead>
                <tbody id="admin-user-table"></tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="problem-section" class="hidden problem-card">
          <header>
            <div style="display:flex; justify-content: space-between; align-items: baseline; gap: 1rem;">
              <h2 id="problem-title">题目</h2>
              <a id="problem-link" href="#" target="_blank" rel="noopener" style="font-size:0.9rem;">在 Codeforces 查看</a>
            </div>
            <div class="problem-meta">
              <span>难度：<strong id="problem-difficulty">-</strong></span>
              <span>来源：Codeforces</span>
            </div>
          </header>
          <p id="extension-warning" class="message error hidden" style="margin:0;">
            请先安装并启用平台指定的 Tampermonkey 防作弊脚本，页面检测到脚本后才可以开始抽题。
          </p>
          <div id="problem-statement" class="problem-statement">请先选择难度范围并加载题目。</div>
          <div class="grid-two">
            <form id="difficulty-form" class="problem-controls">
              <label>最低难度（含）<input type="number" id="min-difficulty" min="800" max="3500" step="100" value="800" /></label>
              <label>最高难度（含）<input type="number" id="max-difficulty" min="800" max="3500" step="100" value="1600" /></label>
              <button type="submit">获取随机题目</button>
            </form>
            <div>
              <h3>请选择算法标签</h3>
              <div id="tag-options" class="tag-options"></div>
              <div style="margin-top:1rem; display:flex; gap:0.75rem; align-items:center;">
                <button id="submit-attempt" disabled>提交答案</button>
                <span id="attempt-message" class="message hidden"></span>
              </div>
            </div>
          </div>
        </section>

        <section id="leaderboard-section">
          <h2>排行榜</h2>
          <table>
            <thead>
              <tr><th>#</th><th>用户</th><th>积分</th></tr>
            </thead>
            <tbody id="leaderboard-body"></tbody>
          </table>
        </section>
      </main>
    </div>
    <script>
      const EXTENSION_STATUS_INTERVAL = 5000;
      const state = {
        token: localStorage.getItem('alg_guessr_token'),
        user: null,
        problem: null,
        registrationOpen: true,
        selectedTags: new Set(),
        extensionVerified: false,
      };
      let extensionStatusTimer = null;

      function setMessage(el, text, type = '') {
        if (!el) return;
        el.textContent = text;
        el.classList.remove('hidden', 'error');
        if (type === 'error') {
          el.classList.add('error');
        }
        if (!text) {
          el.classList.add('hidden');
        }
      }

      async function api(path, options = {}) {
        const headers = { ...(options.headers || {}) };
        const hasBody = options.body !== undefined && !(options.body instanceof FormData);
        if (hasBody && !headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
        if (state.token) {
          headers['Authorization'] = 'Bearer ' + state.token;
        }
        const response = await fetch(path, { ...options, headers });
        if (response.status === 204) return null;
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || '请求失败');
        }
        return data;
      }

      function updateAuthUI() {
        const authSection = document.getElementById('auth-section');
        const userSection = document.getElementById('user-section');
        const problemSection = document.getElementById('problem-section');
        if (state.user) {
          authSection.classList.add('hidden');
          userSection.classList.remove('hidden');
          problemSection.classList.remove('hidden');
          document.getElementById('user-name').textContent = state.user.username;
          document.getElementById('user-score').textContent = state.user.score;
          document.getElementById('user-status').textContent = state.user.is_banned ? '已封禁' : '正常';
          document.getElementById('logout-btn').disabled = false;
          if (state.user.role === 'admin') {
            loadAdminData();
            document.getElementById('admin-panel').classList.remove('hidden');
          } else {
            document.getElementById('admin-panel').classList.add('hidden');
          }
        } else {
          authSection.classList.remove('hidden');
          userSection.classList.add('hidden');
          problemSection.classList.add('hidden');
          document.getElementById('admin-panel').classList.add('hidden');
          document.getElementById('tag-options').innerHTML = '';
          document.getElementById('problem-statement').textContent = '请先登录后获取题目。';
          state.problem = null;
          state.selectedTags.clear();
        }
        updateExtensionUI();
      }

      function updateRegistrationUI() {
        const registerForm = document.getElementById('register-form');
        const closedMessage = document.getElementById('register-closed');
        if (state.registrationOpen) {
          registerForm.classList.remove('hidden');
          closedMessage.classList.add('hidden');
        } else {
          registerForm.classList.add('hidden');
          closedMessage.classList.remove('hidden');
        }
      }

      function renderTagOptions(options = []) {
        const container = document.getElementById('tag-options');
        container.innerHTML = '';
        state.selectedTags.clear();
        options.forEach((item) => {
          const key = typeof item === 'string' ? item : item?.key;
          const label = typeof item === 'string' ? item : item?.label || item?.key || '';
          if (!key) return;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'tag-option';
          btn.textContent = label;
          btn.dataset.tag = key;
          btn.addEventListener('click', () => {
            if (btn.classList.contains('correct') || btn.classList.contains('incorrect')) return;
            if (state.selectedTags.has(key)) {
              state.selectedTags.delete(key);
              btn.classList.remove('selected');
            } else {
              state.selectedTags.add(key);
              btn.classList.add('selected');
            }
            document.getElementById('submit-attempt').disabled = state.selectedTags.size === 0;
          });
          container.appendChild(btn);
        });
        document.getElementById('submit-attempt').disabled = true;
        setMessage(document.getElementById('attempt-message'), '');
      }

      function markAttemptResult(correctTags, correct) {
        const container = document.getElementById('tag-options');
        const buttons = container.querySelectorAll('.tag-option');
        const correctSet = new Set(correctTags || []);
        buttons.forEach((btn) => {
          const tag = btn.dataset.tag;
          if (correctSet.has(tag)) {
            btn.classList.add('correct');
          }
          if (state.selectedTags.has(tag) && !correctSet.has(tag)) {
            btn.classList.add('incorrect');
          }
          btn.classList.remove('selected');
        });
        document.getElementById('submit-attempt').disabled = true;
        setMessage(
          document.getElementById('attempt-message'),
          correct ? '回答正确！积分 +1' : '回答错误，正确标签已标记。积分 -1',
          correct ? '' : 'error'
        );
      }

      function setExtensionLock(button, locked) {
        if (!button) return;
        if (locked) {
          button.dataset.extensionLock = 'true';
          button.disabled = true;
        } else if (button.dataset.extensionLock) {
          delete button.dataset.extensionLock;
          button.disabled = false;
        }
      }

      function updateExtensionUI() {
        const warning = document.getElementById('extension-warning');
        const fetchBtn = document.querySelector('#difficulty-form button[type="submit"]');
        const refreshBtn = document.getElementById('refresh-problem');
        const submitBtn = document.getElementById('submit-attempt');
        const shouldWarn = Boolean(state.user) && !state.extensionVerified;
        if (warning) {
          warning.classList.toggle('hidden', !shouldWarn);
        }
        if (shouldWarn) {
          setExtensionLock(fetchBtn, true);
          setExtensionLock(refreshBtn, true);
          if (submitBtn) {
            submitBtn.dataset.extensionLock = 'true';
            submitBtn.disabled = true;
          }
        } else {
          setExtensionLock(fetchBtn, false);
          setExtensionLock(refreshBtn, false);
          if (submitBtn && submitBtn.dataset.extensionLock) {
            delete submitBtn.dataset.extensionLock;
            submitBtn.disabled = state.selectedTags.size === 0;
          }
        }
      }

      function appendTextCell(row: HTMLTableRowElement, value: string | number) {
        const cell = document.createElement('td');
        cell.textContent = String(value);
        row.appendChild(cell);
      }

      async function loadLeaderboard() {
        try {
          const data = await api('/api/leaderboard', { method: 'GET', headers: {} });
          const tbody = document.getElementById('leaderboard-body');
          tbody.innerHTML = '';
          data.leaderboard.forEach((entry, index) => {
            const tr = document.createElement('tr');

            appendTextCell(tr, index + 1);
            appendTextCell(tr, entry.username);
            appendTextCell(tr, entry.score);

            tbody.appendChild(tr);
          });
        } catch (err) {
          console.error(err);
        }
      }

      async function loadProblem(range) {
        if (!state.user) return;
        document.getElementById('submit-attempt').disabled = true;
        setMessage(document.getElementById('attempt-message'), '加载中...');
        try {
          const params = new URLSearchParams(range).toString();
          const data = await api('/api/problem?' + params, { method: 'GET', headers: {} });
          state.problem = data.problem;
          document.getElementById('problem-title').textContent = data.problem.title;
          document.getElementById('problem-difficulty').textContent = data.problem.difficulty ?? '未知';
          document.getElementById('problem-link').href = data.problem.url;
          document.getElementById('problem-statement').innerHTML = data.problem.statement || '暂时无法获取题面，请点击链接查看原题。';
          renderTagOptions(data.problem.availableTags || []);
          setMessage(document.getElementById('attempt-message'), '请选择你认为正确的算法标签');
        } catch (err) {
          console.error(err);
          setMessage(document.getElementById('attempt-message'), err.message || '题目加载失败', 'error');
        }
      }

      async function fetchStatus() {
        try {
          const data = await api('/api/status', { method: 'GET', headers: {} });
          state.registrationOpen = data.registrationOpen;
          updateRegistrationUI();
        } catch (err) {
          console.error(err);
        }
      }

      function stopExtensionWatcher() {
        if (extensionStatusTimer) {
          clearInterval(extensionStatusTimer);
          extensionStatusTimer = null;
        }
      }

      function startExtensionWatcher() {
        stopExtensionWatcher();
        if (!state.token) return;
        checkExtensionStatus();
        window.dispatchEvent(new CustomEvent('algGuessrExtensionCheck'));
        extensionStatusTimer = setInterval(checkExtensionStatus, EXTENSION_STATUS_INTERVAL);
      }

      async function checkExtensionStatus() {
        if (!state.token) {
          state.extensionVerified = false;
          updateExtensionUI();
          return;
        }
        try {
          const data = await api('/api/extension/status', { method: 'GET', headers: {} });
          state.extensionVerified = Boolean(data?.verified);
        } catch (err) {
          state.extensionVerified = false;
        }
        updateExtensionUI();
      }

      async function fetchProfile() {
        if (!state.token) {
          state.user = null;
          updateAuthUI();
          stopExtensionWatcher();
          state.extensionVerified = false;
          updateExtensionUI();
          return;
        }
        try {
          const data = await api('/api/me', { method: 'GET', headers: {} });
          state.user = data.user;
          state.registrationOpen = data.registrationOpen;
          state.extensionVerified = Boolean(data.extensionVerified);
          updateAuthUI();
          updateRegistrationUI();
          updateExtensionUI();
          startExtensionWatcher();
        } catch (err) {
          console.warn('profile fetch failed', err);
          state.token = null;
          localStorage.removeItem('alg_guessr_token');
          state.user = null;
          updateAuthUI();
          stopExtensionWatcher();
          state.extensionVerified = false;
          updateExtensionUI();
        }
      }

      async function loadAdminData() {
        if (!state.user || state.user.role !== 'admin') return;
        try {
          const data = await api('/api/admin/users', { method: 'GET', headers: {} });
          const tbody = document.getElementById('admin-user-table');
          tbody.innerHTML = '';
          data.users.forEach((user) => {
            const tr = document.createElement('tr');

            appendTextCell(tr, user.username);
            appendTextCell(tr, user.score);
            appendTextCell(tr, user.role);
            appendTextCell(tr, user.is_banned ? '封禁' : '正常');

            tbody.appendChild(tr);
          });
          state.registrationOpen = data.registrationOpen;
          document.getElementById('registration-state').textContent = state.registrationOpen ? '当前注册已开放' : '当前注册已关闭';
          document.getElementById('toggle-registration').textContent = state.registrationOpen ? '关闭注册入口' : '开放注册入口';
        } catch (err) {
          console.error(err);
        }
      }

      document.getElementById('login-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        setMessage(document.getElementById('login-error'), '');
        try {
          const result = await api('/api/login', { method: 'POST', body: JSON.stringify(data) });
          state.token = result.token;
          localStorage.setItem('alg_guessr_token', state.token);
          await fetchProfile();
          await loadLeaderboard();
        } catch (err) {
          setMessage(document.getElementById('login-error'), err.message || '登录失败', 'error');
        }
      });

      document.getElementById('register-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        setMessage(document.getElementById('register-error'), '');
        try {
          await api('/api/register', { method: 'POST', body: JSON.stringify(data) });
          setMessage(document.getElementById('register-error'), '注册成功，请登录。');
          form.reset();
        } catch (err) {
          setMessage(document.getElementById('register-error'), err.message || '注册失败', 'error');
        }
      });

      document.getElementById('logout-btn').addEventListener('click', () => {
        state.token = null;
        state.user = null;
        localStorage.removeItem('alg_guessr_token');
        stopExtensionWatcher();
        state.extensionVerified = false;
        updateAuthUI();
      });

      document.getElementById('refresh-problem').addEventListener('click', () => {
        const min = document.getElementById('min-difficulty').value;
        const max = document.getElementById('max-difficulty').value;
        loadProblem({ min, max });
      });

      document.getElementById('difficulty-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const min = document.getElementById('min-difficulty').value;
        const max = document.getElementById('max-difficulty').value;
        loadProblem({ min, max });
      });

      document.getElementById('submit-attempt').addEventListener('click', async () => {
        if (!state.problem || state.selectedTags.size === 0) return;
        const payload = {
          problemId: state.problem.id,
          selectedTags: Array.from(state.selectedTags),
        };
        try {
          const result = await api('/api/attempt', { method: 'POST', body: JSON.stringify(payload) });
          state.user.score = result.score;
          document.getElementById('user-score').textContent = state.user.score;
          markAttemptResult(result.correctTags, result.correct);
          loadLeaderboard();
        } catch (err) {
          setMessage(document.getElementById('attempt-message'), err.message || '提交失败', 'error');
        }
      });

      document.getElementById('toggle-registration').addEventListener('click', async () => {
        if (!state.user || state.user.role !== 'admin') return;
        try {
          const data = await api('/api/admin/registration-toggle', {
            method: 'POST',
            body: JSON.stringify({ open: !state.registrationOpen }),
          });
          state.registrationOpen = data.registrationOpen;
          document.getElementById('registration-state').textContent = state.registrationOpen ? '当前注册已开放' : '当前注册已关闭';
          document.getElementById('toggle-registration').textContent = state.registrationOpen ? '关闭注册入口' : '开放注册入口';
          updateRegistrationUI();
        } catch (err) {
          console.error(err);
        }
      });

      document.getElementById('admin-register-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!state.user || state.user.role !== 'admin') return;
        const data = Object.fromEntries(new FormData(event.currentTarget));
        try {
          await api('/api/admin/register', { method: 'POST', body: JSON.stringify(data) });
          event.currentTarget.reset();
          loadAdminData();
        } catch (err) {
          alert(err.message || '后台注册失败');
        }
      });

      document.getElementById('admin-ban-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!state.user || state.user.role !== 'admin') return;
        const data = Object.fromEntries(new FormData(event.currentTarget));
        try {
          await api('/api/admin/ban', { method: 'POST', body: JSON.stringify(data) });
          loadAdminData();
        } catch (err) {
          alert(err.message || '封禁失败');
        }
      });

      document.getElementById('admin-unban-btn').addEventListener('click', async () => {
        if (!state.user || state.user.role !== 'admin') return;
        const username = new FormData(document.getElementById('admin-ban-form')).get('username');
        if (!username) return;
        try {
          await api('/api/admin/unban', { method: 'POST', body: JSON.stringify({ username }) });
          loadAdminData();
        } catch (err) {
          alert(err.message || '解封失败');
        }
      });

      window.addEventListener('algGuessrExtensionVerified', () => {
        state.extensionVerified = true;
        updateExtensionUI();
      });

      fetchStatus();
      fetchProfile();
      loadLeaderboard();
    </script>
  </body>
</html>`;
}
