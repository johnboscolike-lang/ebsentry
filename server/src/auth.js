import crypto from 'node:crypto';

export const COOKIE_NAME = 'ebs_admin';
const MAX_AGE_SECONDS = 60 * 60 * 12;

function secret() {
  return crypto.createHash('sha256').update(`ebs-apply|${process.env.ADMIN_PASSWORD || ''}`).digest();
}

export function adminConfigured() {
  return (process.env.ADMIN_PASSWORD || '').length >= 8;
}

/**
 * Constant-time password check. The digest hides the password length.
 * @param {unknown} input
 */
export function checkPassword(input) {
  if (!adminConfigured()) return false;
  const actual = crypto.createHash('sha256').update(String(input ?? ''), 'utf8').digest();
  const expected = crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD || '', 'utf8').digest();
  return crypto.timingSafeEqual(actual, expected);
}

export function issueToken() {
  const body = Buffer.from(JSON.stringify({ role: 'admin', exp: Date.now() + MAX_AGE_SECONDS * 1000 })).toString(
    'base64url',
  );
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

/**
 * @param {unknown} token
 */
export function verifyToken(token) {
  if (!adminConfigured() || typeof token !== 'string' || !token.includes('.')) return false;
  const [body, sig] = token.split('.');
  if (!body || !sig) return false;
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  const actualBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(actualBuf, expectedBuf)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return payload.role === 'admin' && typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

/**
 * @param {import('express').Request} req
 * @param {string} name
 */
export function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

/**
 * @param {import('express').Request} req
 */
export function isAdmin(req) {
  return verifyToken(readCookie(req, COOKIE_NAME));
}

/**
 * @param {import('express').Response} res
 * @param {import('express').Request} req
 * @param {string} token
 */
export function setAuthCookie(res, req, token) {
  res.setHeader('Set-Cookie', cookieValue(req, token, MAX_AGE_SECONDS));
}

/**
 * @param {import('express').Response} res
 * @param {import('express').Request} req
 */
export function clearAuthCookie(res, req) {
  res.setHeader('Set-Cookie', cookieValue(req, '', 0));
}

/**
 * @param {import('express').Request} req
 * @param {string} token
 * @param {number} maxAge
 */
function cookieValue(req, token, maxAge) {
  const secure = process.env.COOKIE_SECURE === '1' || req.secure;
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}
