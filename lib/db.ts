import fs from 'fs';
import path from 'path';
import { FullPortalData } from './types';
import { INITIAL_DATA, DEFAULT_TABLE_COLUMNS } from './initial-data';

export { INITIAL_DATA, DEFAULT_TABLE_COLUMNS };

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const TMP_DB_FILE = path.join('/tmp', 'db.json');

declare global {
  var __PORTAL_DB__: FullPortalData | undefined;
}

export function getDbData(): FullPortalData {
  if (globalThis.__PORTAL_DB__) {
    return globalThis.__PORTAL_DB__;
  }

  try {
    // 1. Try reading from /tmp/db.json (serverless disk)
    if (fs.existsSync(TMP_DB_FILE)) {
      const raw = fs.readFileSync(TMP_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as FullPortalData;
      if (parsed && Array.isArray(parsed.payments)) {
        globalThis.__PORTAL_DB__ = parsed;
        return parsed;
      }
    }

    // 2. Try reading from project data/db.json
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as FullPortalData;
      if (parsed && Array.isArray(parsed.payments)) {
        globalThis.__PORTAL_DB__ = parsed;
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading DB data:', error);
  }

  globalThis.__PORTAL_DB__ = INITIAL_DATA;
  return INITIAL_DATA;
}

export async function getDbDataAsync(): Promise<FullPortalData> {
  return getDbData();
}

export async function saveDbData(data: FullPortalData): Promise<void> {
  // Always update in-memory cache instantly so GET /api/v1/public-data immediately returns updated data
  globalThis.__PORTAL_DB__ = data;

  // 1. Write to /tmp/db.json (always writable in Vercel Serverless Functions)
  try {
    fs.writeFileSync(TMP_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to /tmp/db.json:', err);
  }

  // 2. Write to project data/db.json (writable in local development)
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Ignore EROFS error on Vercel production serverless filesystem
  }
}
