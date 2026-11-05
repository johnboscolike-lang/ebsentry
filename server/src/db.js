import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/**
 * @param {string} file
 */
export function openDatabase(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      name TEXT NOT NULL,
      grade TEXT NOT NULL,
      department TEXT NOT NULL,
      weekly_hours REAL NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(created_at);
  `);
  try {
    db.exec('PRAGMA journal_mode = WAL');
  } catch {
    // WAL is optional. The default journal still stores submissions safely.
  }
  return db;
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {Record<string, any>} record
 */
export function insertApplication(db, record) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const row = db.prepare('SELECT COUNT(*) AS c FROM applications').get();
    const id = `EBS-${String(Number(row.c) + 1).padStart(4, '0')}`;
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO applications (id, created_at, name, grade, department, weekly_hours, payload)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, createdAt, record.name, record.grade, record.department, record.selectedHours, JSON.stringify(record));
    db.exec('COMMIT');
    return { id, createdAt };
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // Ignore a rollback failure and surface the original error.
    }
    throw error;
  }
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 */
export function listApplications(db) {
  const rows = db
    .prepare('SELECT id, created_at, payload FROM applications ORDER BY created_at DESC, id DESC')
    .all();
  /** @type {Record<string, any>[]} */
  const applications = [];
  for (const row of rows) {
    try {
      applications.push({
        ...JSON.parse(String(row.payload)),
        id: row.id,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.error(`Skipping unreadable application ${row.id}`, error);
    }
  }
  return applications;
}
