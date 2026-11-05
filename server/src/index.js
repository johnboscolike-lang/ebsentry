import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { openDatabase } from './db.js';
import { loadEnvFile } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
loadEnvFile(path.join(root, '.env'));

const dataDir = path.resolve(root, process.env.DATA_DIR || 'data');
const db = openDatabase(path.join(dataDir, 'applications.db'));
const app = createApp({ db });
const port = Number(process.env.PORT || 3100);
const host = process.env.HOST || '0.0.0.0';

const server = app.listen(port, host, () => {
  const password = process.env.ADMIN_PASSWORD || '';
  console.log(`EBS apply listening on http://${host}:${port}`);
  console.log(`Data directory: ${dataDir}`);
  if (password.length < 8) {
    console.warn('ADMIN_PASSWORD is missing or shorter than 8 characters. Admin login is disabled.');
  } else if (password === 'change-me-please') {
    console.warn('ADMIN_PASSWORD is still the example value. Change it before exposing the server.');
  }
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 3000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
