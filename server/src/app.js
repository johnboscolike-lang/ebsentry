import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { validateApplication } from '../../shared/validate.js';
import {
  adminConfigured,
  checkPassword,
  clearAuthCookie,
  isAdmin,
  issueToken,
  setAuthCookie,
} from './auth.js';
import { applicationsToCsv } from './csv.js';
import { insertApplication, listApplications } from './db.js';
import { summarize } from './stats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultStaticDir = path.resolve(__dirname, '../../client/dist');

/** @type {Map<string, number[]>} */
const hits = new Map();

/**
 * @param {string} key
 * @param {number} limit
 * @param {number} windowMs
 */
function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  res.status(401).json({ error: '로그인이 필요해요.' });
}

/**
 * @param {{ db: import('node:sqlite').DatabaseSync, staticDir?: string }} options
 */
export function createApp({ db, staticDir = defaultStaticDir }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '200kb' }));
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'ebs-apply' });
  });

  app.post('/api/applications', (req, res) => {
    const limit = Number(process.env.APPLY_RATE_LIMIT || 120);
    if (!rateLimit(`apply:${req.ip}`, limit, 60 * 60 * 1000)) {
      res.status(429).json({ error: '신청이 잠시 몰려 있어요. 조금 뒤에 다시 눌러 주세요.' });
      return;
    }
    const result = validateApplication(req.body);
    if (!result.ok) {
      res.status(400).json({ error: '입력 내용을 다시 확인해 주세요.', errors: result.errors });
      return;
    }
    const saved = insertApplication(db, result.value);
    console.log(`application stored ${saved.id}`);
    res.status(201).json(saved);
  });

  app.post('/api/admin/login', (req, res) => {
    if (!rateLimit(`login:${req.ip}`, 30, 15 * 60 * 1000)) {
      res.status(429).json({ error: '시도가 너무 많아요. 잠시 후 다시 로그인해 주세요.' });
      return;
    }
    if (!adminConfigured()) {
      res.status(503).json({ error: '관리자 비밀번호가 8자 이상으로 설정되지 않았어요.' });
      return;
    }
    if (!checkPassword(req.body?.password)) {
      res.status(401).json({ error: '비밀번호가 맞지 않아요.' });
      return;
    }
    setAuthCookie(res, req, issueToken());
    res.json({ ok: true });
  });

  app.post('/api/admin/logout', (req, res) => {
    clearAuthCookie(res, req);
    res.json({ ok: true });
  });

  app.get('/api/admin/me', (req, res) => {
    if (!isAdmin(req)) {
      res.status(401).json({ ok: false });
      return;
    }
    res.json({ ok: true });
  });

  app.get('/api/admin/submissions', requireAdmin, (_req, res) => {
    res.json({ submissions: listApplications(db) });
  });

  app.get('/api/admin/stats', requireAdmin, (_req, res) => {
    res.json(summarize(listApplications(db)));
  });

  app.get('/api/admin/export.csv', requireAdmin, (_req, res) => {
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="ebs-applications-${stamp}.csv"`);
    res.send(applicationsToCsv(listApplications(db)));
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: '요청한 주소를 찾지 못했어요.' });
  });

  app.use(express.static(staticDir, { index: false, maxAge: '1h' }));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (path.extname(req.path)) return res.status(404).type('text/plain').send('Not found');
    res.sendFile(path.join(staticDir, 'index.html'), (error) => {
      if (error) next();
    });
  });

  app.use((error, _req, res, _next) => {
    if (error?.type === 'entity.parse.failed') {
      res.status(400).json({ error: '잘못된 요청입니다.' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  });

  return app;
}
