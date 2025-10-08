import { Router } from 'itty-router';
import { renderApp } from './ui/index';

interface Env {
  DB: D1Database;
  PROBLEM_CACHE: KVNamespace;
  JWT_SECRET: string;
}

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  salt: string;
  role: 'user' | 'admin';
  is_banned: number;
  score: number;
  created_at: string;
  updated_at: string;
}

interface ProblemMetadata {
  id: string;
  title: string;
  difficulty?: number;
  statement?: string;
  tags: string[];
  url: string;
  fetchedAt: number;
}

const AVAILABLE_TAGS = [
  'dp',
  'greedy',
  'implementation',
  'math',
  'brute force',
  'data structures',
  'graphs',
  'constructive algorithms',
  'sortings',
  'binary search',
  'combinatorics',
  'number theory',
  'trees',
  'geometry',
  'shortest paths',
  'strings',
  'dfs and similar',
  'two pointers',
  'bitmasks',
  'probabilities',
  'hashing',
  'games',
  'flows',
  'matrices',
  'meet-in-the-middle',
  'graph matchings',
  'ternary search',
  'dsu',
  'divide and conquer',
  'expression parsing',
  'schedules',
  'scc',
  'fft',
  'interactive',
  '2-sat',
  'chinese remainder theorem',
];

const TAG_TRANSLATIONS: Record<string, string> = {
  dp: '动态规划',
  greedy: '贪心',
  implementation: '实现',
  math: '数学',
  'brute force': '暴力枚举',
  'data structures': '数据结构',
  graphs: '图论',
  'constructive algorithms': '构造',
  sortings: '排序',
  'binary search': '二分查找',
  combinatorics: '组合数学',
  'number theory': '数论',
  trees: '树',
  geometry: '几何',
  'shortest paths': '最短路',
  strings: '字符串',
  'dfs and similar': '深搜及相关',
  'two pointers': '双指针',
  bitmasks: '位运算/状态压缩',
  probabilities: '概率',
  hashing: '哈希',
  games: '博弈论',
  flows: '网络流',
  matrices: '矩阵',
  'meet-in-the-middle': '折半搜索',
  'graph matchings': '图匹配',
  'ternary search': '三分查找',
  dsu: '并查集',
  'divide and conquer': '分治',
  'expression parsing': '表达式解析',
  schedules: '调度',
  scc: '强连通分量',
  fft: '快速傅里叶变换',
  interactive: '交互题',
  '2-sat': '2-SAT',
  'chinese remainder theorem': '中国剩余定理',
};

const EXTENSION_TTL_SECONDS = 5 * 60;

function translateTag(tag: string): string {
  return TAG_TRANSLATIONS[tag] ?? tag;
}

function extensionVerificationKey(userId: number): string {
  return `extension:${userId}`;
}

async function markExtensionVerified(env: Env, userId: number): Promise<void> {
  await env.PROBLEM_CACHE.put(
    extensionVerificationKey(userId),
    JSON.stringify({ verifiedAt: Date.now() }),
    { expirationTtl: EXTENSION_TTL_SECONDS },
  );
}

async function isExtensionVerified(env: Env, userId: number): Promise<boolean> {
  const cached = await env.PROBLEM_CACHE.get(extensionVerificationKey(userId), 'json');
  return Boolean(cached);
}

const router = Router();

router.options('*', () =>
  new Response(null, {
    status: 204,
    headers: buildCorsHeaders(),
  }),
);

router.get('/', () =>
  new Response(renderApp(), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  }),
);

router.get('/api/status', async (request, env: Env) => {
  const registrationOpen = await getRegistrationState(env);
  return json({ registrationOpen });
});

router.post('/api/register', async (request, env: Env) => {
  const { username, password } = await readJson(request);
  if (!username || !password) {
    return error('用户名和密码不能为空', 400);
  }
  if (typeof username !== 'string' || typeof password !== 'string') {
    return error('参数格式不正确', 400);
  }
  const trimmedUsername = username.trim();
  if (trimmedUsername.length < 3 || trimmedUsername.length > 32) {
    return error('用户名长度需在 3-32 之间', 400);
  }
  if (password.length < 6 || password.length > 64) {
    return error('密码长度需在 6-64 之间', 400);
  }

  const userCountRow = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
  const registrationOpen = await getRegistrationState(env);
  if (userCountRow && userCountRow.count > 0 && !registrationOpen) {
    return error('注册暂未开放', 403);
  }

  const { hash, salt } = await hashPassword(password);
  const role = userCountRow && userCountRow.count === 0 ? 'admin' : 'user';
  try {
    await env.DB.prepare(
      `INSERT INTO users (username, password_hash, salt, role)
       VALUES (?, ?, ?, ?)`,
    )
      .bind(trimmedUsername, hash, salt, role)
      .run();
  } catch (err) {
    return error('用户名已存在', 409);
  }

  return json({ success: true, role });
});

router.post('/api/login', async (request, env: Env) => {
  const { username, password } = await readJson(request);
  if (!username || !password) {
    return error('用户名和密码不能为空', 400);
  }
  const row = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<UserRow>();
  if (!row) {
    return error('用户名或密码错误', 401);
  }
  if (row.is_banned) {
    return error('账号已被封禁，请联系管理员', 403);
  }
  const valid = await verifyPassword(password, row.password_hash, row.salt);
  if (!valid) {
    return error('用户名或密码错误', 401);
  }
  const token = await createToken(env, {
    sub: row.id,
    username: row.username,
    role: row.role,
  });
  return json({ token });
});

router.get('/api/me', withAuth(async (request, env, user) => {
  const registrationOpen = await getRegistrationState(env);
  return json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      score: user.score,
      is_banned: user.is_banned === 1,
    },
    registrationOpen,
    extensionVerified: await isExtensionVerified(env, user.id),
  });
}));

router.get('/api/extension/status', withAuth(async (request, env, user) => {
  const verified = await isExtensionVerified(env, user.id);
  return json({ verified });
}));

router.post('/api/extension/verify', withAuth(async (request, env, user) => {
  const { installed } = await readJson(request);
  if (installed === false) {
    await env.PROBLEM_CACHE.delete(extensionVerificationKey(user.id));
    return json({ verified: false });
  }
  await markExtensionVerified(env, user.id);
  return json({ verified: true });
}));

router.get('/api/problem', withAuth(async (request, env, user) => {
  if (user.is_banned) {
    return error('账号已被封禁', 403);
  }
  const extensionVerified = await isExtensionVerified(env, user.id);
  if (!extensionVerified) {
    return error('请先安装并启用防作弊插件，然后刷新页面重试', 428);
  }
  const url = new URL(request.url);
  const min = Number(url.searchParams.get('min') || '800');
  const max = Number(url.searchParams.get('max') || '1600');
  if (Number.isNaN(min) || Number.isNaN(max) || min < 800 || max > 3500 || min > max) {
    return error('难度范围不合法', 400);
  }
  const problem = await fetchRandomProblem(env, min, max);
  if (!problem) {
    return error('无法获取题目，请稍后重试', 502);
  }
  return json({
    problem: {
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      statement: problem.statement,
      url: problem.url,
      availableTags: AVAILABLE_TAGS.map((tag) => ({ key: tag, label: translateTag(tag) })),
    },
  });
}));

router.post('/api/attempt', withAuth(async (request, env, user) => {
  if (user.is_banned) {
    return error('账号已被封禁', 403);
  }
  const extensionVerified = await isExtensionVerified(env, user.id);
  if (!extensionVerified) {
    return error('检测到防作弊插件未激活，无法提交答案', 428);
  }
  const { problemId, selectedTags } = await readJson(request);
  if (!problemId || !Array.isArray(selectedTags)) {
    return error('参数不正确', 400);
  }
  const meta = await env.PROBLEM_CACHE.get<ProblemMetadata>(problemCacheKey(problemId), 'json');
  if (!meta) {
    return error('题目已过期，请重新获取', 410);
  }
  const chosen = new Set<string>(selectedTags.map((tag: string) => String(tag)));
  const correctSet = new Set(meta.tags);
  let correct = true;
  if (chosen.size !== correctSet.size) {
    correct = false;
  } else {
    for (const tag of chosen) {
      if (!correctSet.has(tag)) {
        correct = false;
        break;
      }
    }
  }
  const delta = correct ? 1 : -1;
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE users
       SET score = score + ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    ).bind(delta, user.id),
    env.DB.prepare(
      `INSERT INTO problem_attempts (user_id, problem_id, correct, selected_tags, correct_tags)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(user.id, problemId, correct ? 1 : 0, JSON.stringify([...chosen]), JSON.stringify([...correctSet])),
  ]);
  const updated = await env.DB.prepare('SELECT score FROM users WHERE id = ?').bind(user.id).first<{ score: number }>();
  return json({
    correct,
    correctTags: [...correctSet],
    score: updated?.score ?? user.score + delta,
  });
}));

router.get('/api/leaderboard', async (request, env: Env) => {
  const results = await env.DB.prepare(
    `SELECT username, score
     FROM users
     WHERE is_banned = 0
     ORDER BY score DESC, username ASC
     LIMIT 20`,
  ).all<{ username: string; score: number }>();
  return json({ leaderboard: results.results ?? [] });
});

router.get('/api/admin/users', withAdmin(async (request, env) => {
  const users = await env.DB.prepare(
    `SELECT id, username, role, is_banned, score
     FROM users
     ORDER BY created_at ASC`
  ).all<UserRow>();
  const registrationOpen = await getRegistrationState(env);
  return json({
    users: (users.results ?? []).map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      is_banned: u.is_banned === 1,
      score: u.score,
    })),
    registrationOpen,
  });
}));

router.post('/api/admin/register', withAdmin(async (request, env) => {
  const { username, password } = await readJson(request);
  if (!username || !password) {
    return error('请输入用户名和密码', 400);
  }
  const trimmedUsername = String(username).trim();
  if (trimmedUsername.length < 3) {
    return error('用户名过短', 400);
  }
  const { hash, salt } = await hashPassword(String(password));
  try {
    await env.DB.prepare(
      `INSERT INTO users (username, password_hash, salt, role)
       VALUES (?, ?, ?, 'user')`
    ).bind(trimmedUsername, hash, salt).run();
  } catch (err) {
    return error('用户名已存在', 409);
  }
  return json({ success: true });
}));

router.post('/api/admin/ban', withAdmin(async (request, env) => {
  const { username } = await readJson(request);
  if (!username) {
    return error('请输入用户名', 400);
  }
  await env.DB.prepare(
    `UPDATE users
     SET is_banned = 1, updated_at = CURRENT_TIMESTAMP
     WHERE username = ? AND role != 'admin'`
  ).bind(username).run();
  return json({ success: true });
}));

router.post('/api/admin/unban', withAdmin(async (request, env) => {
  const { username } = await readJson(request);
  if (!username) {
    return error('请输入用户名', 400);
  }
  await env.DB.prepare(
    `UPDATE users
     SET is_banned = 0, updated_at = CURRENT_TIMESTAMP
     WHERE username = ?`
  ).bind(username).run();
  return json({ success: true });
}));

router.post('/api/admin/registration-toggle', withAdmin(async (request, env) => {
  const { open } = await readJson(request);
  const value = open ? 'true' : 'false';
  await env.DB.prepare(
    `INSERT INTO settings (key, value) VALUES ('registration_open', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).bind(value).run();
  return json({ registrationOpen: open ? true : false });
}));

router.all('*', () => error('未找到资源', 404));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const response = await router.handle(request, env, ctx);
      if (!response) {
        return error('未找到资源', 404);
      }
      return addCors(response);
    } catch (err) {
      console.error('Worker error:', err);
      return addCors(error('服务器内部错误', 500));
    }
  },
};

function buildCorsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
  };
}

function addCors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

async function readJson(request: Request): Promise<any> {
  try {
    if (request.headers.get('content-type')?.includes('application/json')) {
      return await request.json();
    }
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch (err) {
    return {};
  }
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });
}

function error(message: string, status = 400): Response {
  return json({ error: message }, { status });
}

function problemCacheKey(id: string): string {
  return `problem:${id}`;
}

async function getRegistrationState(env: Env): Promise<boolean> {
  const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind('registration_open').first<{ value: string }>();
  if (!row) {
    await env.DB.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES ("registration_open", "true")').run();
    return true;
  }
  return row.value !== 'false';
}

async function fetchRandomProblem(env: Env, minDifficulty: number, maxDifficulty: number): Promise<ProblemMetadata | null> {
  let problemset: any[];
  try {
    problemset = await getProblemset(env);
  } catch (err) {
    console.warn('Failed to load Codeforces problemset', err);
    return null;
  }
  const filtered = problemset.filter((p) => typeof p.rating === 'number' && p.rating >= minDifficulty && p.rating <= maxDifficulty);
  if (!filtered.length) {
    return null;
  }

  const candidates = [...filtered];
  while (candidates.length) {
    const index = Math.floor(Math.random() * candidates.length);
    const [candidate] = candidates.splice(index, 1);
    const metadata = await loadProblemMetadata(env, candidate);
    if (metadata.tags.length > 0) {
      await env.PROBLEM_CACHE.put(problemCacheKey(metadata.id), JSON.stringify(metadata), { expirationTtl: 3600 });
      return metadata;
    }
  }
  return null;
}

async function getProblemset(env: Env): Promise<any[]> {
  const cacheKey = 'cf:problemset';
  const cached = (await env.PROBLEM_CACHE.get<{ problems: any[]; fetchedAt: number }>(cacheKey, 'json')) || null;
  if (cached && Date.now() - cached.fetchedAt < 60 * 60 * 1000) {
    return cached.problems;
  }
  const response = await fetch('https://codeforces.com/api/problemset.problems');
  if (!response.ok) {
    throw new Error('Codeforces API error');
  }
  const json = await response.json<any>();
  if (json.status !== 'OK') {
    throw new Error('Codeforces API returned non-OK status');
  }
  await env.PROBLEM_CACHE.put(cacheKey, JSON.stringify({ problems: json.result.problems, fetchedAt: Date.now() }), {
    expirationTtl: 3600,
  });
  return json.result.problems;
}

async function loadProblemMetadata(env: Env, problem: any): Promise<ProblemMetadata> {
  const id = `${problem.contestId}-${problem.index}`;
  const cachedMeta = await env.PROBLEM_CACHE.get<ProblemMetadata>(problemCacheKey(id), 'json');
  if (cachedMeta) {
    return cachedMeta;
  }

  const problemUrl = `https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`;
  let statement = '';
  let tags: string[] = Array.isArray(problem.tags) ? [...problem.tags] : [];
  let difficulty = problem.rating ?? undefined;

  try {
    const vjudgeId = `CodeForces-${problem.contestId}${problem.index}`;
    const response = await fetch(`https://vjudge.net/problem/data/${vjudgeId}`);
    if (response.ok) {
      const data = await response.json<any>();
      if (data && data.description) {
        statement = sanitizeHtml(data.description);
      }
      if (Array.isArray(data.tags)) {
        tags = data.tags.map((tag: any) => String(tag));
      }
      if (typeof data.difficulty === 'number') {
        difficulty = data.difficulty;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch VJudge data', err);
  }

  if (!statement) {
    try {
      const cfPage = await fetch(problemUrl);
      if (cfPage.ok) {
        const html = await cfPage.text();
        const extracted = extractStatement(html);
        statement = extracted || '';
      }
    } catch (err) {
      console.warn('Failed to fetch Codeforces statement', err);
    }
  }

  const normalizedTags = Array.from(new Set(tags.length ? tags : problem.tags || [])).map((tag) => String(tag));
  const intersected = normalizedTags.filter((tag) => AVAILABLE_TAGS.includes(tag));
  const finalTags = intersected.length ? intersected : [];

  const meta: ProblemMetadata = {
    id,
    title: problem.name,
    difficulty,
    statement,
    tags: finalTags,
    url: problemUrl,
    fetchedAt: Date.now(),
  };

  return meta;
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on[a-z]+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/[a-z]+/gi, '');
}

function extractStatement(html: string): string | null {
  const match = html.match(/<div class="problem-statement">([\s\S]*?)<\/div>\s*<div class="problem-statement"/i);
  if (match) {
    return sanitizeHtml(match[1]);
  }
  const fallback = html.match(/<div class="problem-statement">([\s\S]*?)<\/div>/i);
  return fallback ? sanitizeHtml(fallback[1]) : null;
}

async function hashPassword(password: string): Promise<{ hash: string; salt: string }>; 
async function hashPassword(password: string, salt: string): Promise<{ hash: string; salt: string }>;
async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const saltBytes = salt ? base64ToBytes(salt) : crypto.getRandomValues(new Uint8Array(16));
  const passwordBytes = encoder.encode(password);
  const data = new Uint8Array(saltBytes.length + passwordBytes.length);
  data.set(saltBytes);
  data.set(passwordBytes, saltBytes.length);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hash = bytesToBase64(new Uint8Array(digest));
  const saltValue = salt || bytesToBase64(saltBytes);
  return { hash, salt: saltValue };
}

async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const { hash: computed } = await hashPassword(password, salt);
  return timingSafeEqual(computed, hash);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64ToBytes(base64: string): Uint8Array {
  const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + (4 - (normalized.length % 4)) % 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

interface TokenPayload {
  sub: number;
  username: string;
  role: 'user' | 'admin';
  exp?: number;
}

async function createToken(env: Env, payload: TokenPayload): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, exp: now + 7 * 24 * 60 * 60 };
  const encoder = new TextEncoder();
  const headerEncoded = bytesToBase64(encoder.encode(JSON.stringify(header)));
  const payloadEncoded = bytesToBase64(encoder.encode(JSON.stringify(body)));
  const toSign = `${headerEncoded}.${payloadEncoded}`;
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(toSign));
  const signatureEncoded = bytesToBase64(new Uint8Array(signature));
  return `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
}

async function verifyToken(env: Env, token: string): Promise<TokenPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const data = `${header}.${payload}`;
  const expected = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const expectedEncoded = bytesToBase64(new Uint8Array(expected));
  if (!timingSafeEqual(expectedEncoded, signature)) {
    return null;
  }
  try {
    const decoded = JSON.parse(new TextDecoder().decode(base64ToBytes(payload)));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded as TokenPayload;
  } catch (err) {
    return null;
  }
}

function withAuth(handler: (request: Request, env: Env, user: UserRow) => Promise<Response> | Response) {
  return async (request: Request, env: Env, ctx: ExecutionContext) => {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) {
      return error('未授权访问', 401);
    }
    const payload = await verifyToken(env, token);
    if (!payload) {
      return error('登录已失效，请重新登录', 401);
    }
    const row = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first<UserRow>();
    if (!row) {
      return error('用户不存在', 401);
    }
    return handler(request, env, row);
  };
}

function withAdmin(handler: (request: Request, env: Env, user: UserRow) => Promise<Response> | Response) {
  return withAuth(async (request, env, user) => {
    if (user.role !== 'admin') {
      return error('需要管理员权限', 403);
    }
    return handler(request, env, user);
  });
}

function extractToken(header: string | null): string | null {
  if (!header) return null;
  const parts = header.split(' ');
  if (parts.length !== 2) return null;
  if (parts[0] !== 'Bearer') return null;
  return parts[1];
}
