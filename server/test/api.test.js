import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.ADMIN_PASSWORD = 'test-pass-123';
process.env.APPLY_RATE_LIMIT = '3';
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebs-apply-'));

const { createApp } = await import('../src/app.js');
const { openDatabase } = await import('../src/db.js');
const { departmentForClass, selectedHours } = await import('../../shared/domain.js');

const db = openDatabase(path.join(process.env.DATA_DIR, 'applications.db'));
const staticDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
const app = createApp({ db, staticDir });
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const address = /** @type {import('node:net').AddressInfo} */ (server.address());
const base = `http://127.0.0.1:${address.port}`;

test.after(() => {
  server.close();
  db.close();
});

/**
 * @param {string} pathname
 * @param {RequestInit & { json?: unknown }} [options]
 */
async function api(pathname, options = {}) {
  const headers = new Headers(options.headers);
  let body = options.body;
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.json);
  }
  const res = await fetch(base + pathname, { ...options, headers, body });
  const text = await res.text();
  /** @type {any} */
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { res, json, text };
}

function application(overrides = {}) {
  return {
    name: '김하늘',
    grade: '고1',
    classNumber: 3,
    department: '전기과',
    availableDays: ['월', '수'],
    leaveTime: '18:20',
    dailyHours: 2,
    weeklyHoursIntent: 4,
    slots: ['월|16:20', '월|16:50', '월|17:20', '월|17:50', '수|16:20', '수|16:50', '수|17:20', '수|17:50'],
    commute: ['버스', '도보'],
    commuteMinutes: 25,
    attendsAcademy: true,
    academies: [{ subject: '수학', name: '하늘수학' }],
    careerPath: '진학',
    certsHeld: [],
    certsPlanned: [],
    certsOtherHeld: '',
    certsOtherPlanned: '',
    programInterest: 4,
    motivation: '집에서는 집중이 잘 안 되어서 학습실에서 꾸준히 하고 싶어요.',
    weakSubject: '수학',
    weakSubjectNote: '함수',
    currentStudyHours: '30분–1시간',
    studyDifficulties: ['집중이 오래 안 돼요', '휴대폰이 자꾸 보여요'],
    studyDifficultyNote: '',
    goals: '수학 등급을 올리고 전기기능사에 도전해 보고 싶어요.',
    coachWishes: ['공부 계획을 같이 짜 주세요'],
    coachWishNote: '',
    phoneHabit: '쉬는 시간에만 봐요',
    ...overrides,
  };
}

test('department mapping follows class number', () => {
  assert.equal(departmentForClass(1), '기계과');
  assert.equal(departmentForClass(2), '기계과');
  assert.equal(departmentForClass(4), '전기과');
  assert.equal(departmentForClass(5), '화공과');
  assert.equal(departmentForClass(8), '전자과');
  assert.equal(selectedHours(application().slots), 4);
});

test('health check responds', async () => {
  const { res, json } = await api('/api/health');
  assert.equal(res.status, 200);
  assert.equal(json.ok, true);
});

test('rejects an incomplete application', async () => {
  const { res, json } = await api('/api/applications', {
    method: 'POST',
    headers: { 'x-forwarded-for': '10.0.0.11' },
    json: { name: '김' },
  });
  assert.equal(res.status, 400);
  assert.match(json.errors.name, /이름/);
  assert.equal(json.errors.grade != null, true);
});

test('stores a freshman application by department only', async () => {
  const { res, json } = await api('/api/applications', {
    method: 'POST',
    headers: { 'x-forwarded-for': '10.0.0.21' },
    json: application({
      name: '박새로',
      grade: '27 신입생',
      classNumber: 8,
      department: '화공과',
    }),
  });
  assert.equal(res.status, 201);
  assert.match(json.id, /^EBS-\d{4}$/);

  const login = await api('/api/admin/login', { method: 'POST', json: { password: 'test-pass-123' } });
  const cookie = login.res.headers.getSetCookie()[0].split(';')[0];
  const list = await api('/api/admin/submissions', { headers: { cookie } });
  const saved = list.json.submissions.find((item) => item.name === '박새로');
  assert.equal(saved.department, '화공과');
  assert.equal(saved.classNumber, null);
  assert.equal(saved.selectedHours, 4);
});

test('overrides a mismatched department from the class number', async () => {
  const { res } = await api('/api/applications', {
    method: 'POST',
    headers: { 'x-forwarded-for': '10.0.0.22' },
    json: application({
      name: '이전자',
      grade: '고2',
      classNumber: 1,
      department: '전자과',
      careerPath: '취업',
      certsHeld: ['전산응용기계제도기능사'],
      certsPlanned: ['용접기능사'],
      certsOtherPlanned: '컴퓨터활용능력',
    }),
  });
  assert.equal(res.status, 201);
  const login = await api('/api/admin/login', { method: 'POST', json: { password: 'test-pass-123' } });
  const cookie = login.res.headers.getSetCookie()[0].split(';')[0];
  const list = await api('/api/admin/submissions', { headers: { cookie } });
  const saved = list.json.submissions.find((item) => item.name === '이전자');
  assert.equal(saved.department, '기계과');
  assert.deepEqual(saved.certsHeld, ['전산응용기계제도기능사']);
});

test('rejects a certificate from another department', async () => {
  const { res, json } = await api('/api/applications', {
    method: 'POST',
    headers: { 'x-forwarded-for': '10.0.0.23' },
    json: application({
      careerPath: '취업',
      certsHeld: ['화학분석기능사'],
    }),
  });
  assert.equal(res.status, 400);
  assert.match(json.errors.certsHeld, /자격증/);
});

test('admin login, stats, csv, and logout', async () => {
  const wrong = await api('/api/admin/login', { method: 'POST', json: { password: 'nope-nope' } });
  assert.equal(wrong.res.status, 401);

  const denied = await api('/api/admin/stats');
  assert.equal(denied.res.status, 401);

  const login = await api('/api/admin/login', { method: 'POST', json: { password: 'test-pass-123' } });
  assert.equal(login.res.status, 200);
  const cookie = login.res.headers.getSetCookie()[0].split(';')[0];

  const me = await api('/api/admin/me', { headers: { cookie } });
  assert.equal(me.json.ok, true);

  const stats = await api('/api/admin/stats', { headers: { cookie } });
  assert.equal(stats.res.status, 200);
  assert.equal(stats.json.total >= 2, true);
  assert.equal(stats.json.byDepartment.some((item) => item.label === '화공과' && item.count >= 1), true);
  assert.equal(stats.json.weeklyHours.some((item) => item.label === '0–4시간' && item.count >= 1), true);
  const monday = stats.json.heatmap.days.indexOf('월');
  const slot = stats.json.heatmap.times.indexOf('16:20');
  assert.equal(stats.json.heatmap.matrix[slot][monday] >= 2, true);
  const earlyTuesday = stats.json.heatmap.times.indexOf('15:50');
  const tuesday = stats.json.heatmap.days.indexOf('화');
  assert.equal(stats.json.heatmap.matrix[earlyTuesday][tuesday], null);

  const csvRes = await fetch(base + '/api/admin/export.csv', { headers: { cookie } });
  const csvBytes = Buffer.from(await csvRes.arrayBuffer());
  const csvText = csvBytes.toString('utf8');
  assert.equal(csvRes.status, 200);
  assert.deepEqual([csvBytes[0], csvBytes[1], csvBytes[2]], [0xef, 0xbb, 0xbf]);
  assert.match(csvText, /박새로/);
  assert.match(csvText, /접수번호/);

  const hostile = await api('/api/applications', {
    method: 'POST',
    headers: { 'x-forwarded-for': '10.0.0.24' },
    json: application({ name: '최수식', motivation: '=1+1 은 장난이지만 다섯 글자 이상으로 적어요' }),
  });
  assert.equal(hostile.res.status, 201);
  const exported = await api('/api/admin/export.csv', { headers: { cookie } });
  assert.match(exported.text, /'=1\+1/);

  const logout = await api('/api/admin/logout', { method: 'POST', headers: { cookie } });
  assert.equal(logout.res.status, 200);
  const after = await api('/api/admin/me', { headers: { cookie: logout.res.headers.getSetCookie()[0].split(';')[0] } });
  assert.equal(after.res.status, 401);
});

test('rate limit blocks a burst from one address', async () => {
  const headers = { 'x-forwarded-for': '10.9.9.9' };
  const payload = application({ name: '정제한' });
  const first = await api('/api/applications', { method: 'POST', headers, json: payload });
  const second = await api('/api/applications', { method: 'POST', headers, json: { ...payload, name: '정제한이' } });
  const third = await api('/api/applications', { method: 'POST', headers, json: { ...payload, name: '정제한삼' } });
  const fourth = await api('/api/applications', { method: 'POST', headers, json: { ...payload, name: '정제한사' } });
  assert.equal(first.res.status, 201);
  assert.equal(second.res.status, 201);
  assert.equal(third.res.status, 201);
  assert.equal(fourth.res.status, 429);
});

test('serves the built frontend when dist exists', async () => {
  const indexPath = path.join(staticDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return;
  }
  const { res, text } = await api('/');
  assert.equal(res.status, 200);
  assert.match(text, /입반 신청/);
  const asset = await api('/assets/does-not-exist.js');
  assert.equal(asset.res.status, 404);
});
