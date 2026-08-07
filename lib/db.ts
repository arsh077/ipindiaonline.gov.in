import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { FullPortalData, PaymentItem, PortalSettings, TermSection, PortalConfig, TableColumn } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

import { INITIAL_DATA, DEFAULT_TABLE_COLUMNS } from './initial-data';
export { INITIAL_DATA, DEFAULT_TABLE_COLUMNS };

import { fetchFirebaseData, saveFirebaseData } from './firebase';

declare global {
  var __PORTAL_DB__: FullPortalData | undefined;
}

const TMP_DB_FILE = path.join('/tmp', 'db.json');

export async function getDbDataAsync(): Promise<FullPortalData> {
  const localData = getDbData();
  
  // Sync to Firebase in background if needed without blocking or overwriting local data
  saveFirebaseData(localData).catch(() => {});

  return localData;
}

export function getDbData(): FullPortalData {
  try {
    // 1. Try reading directly from project data/db.json first
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as FullPortalData;
      if (parsed && Array.isArray(parsed.payments)) {
        if (!parsed.tableColumns || !Array.isArray(parsed.tableColumns) || parsed.tableColumns.length === 0) {
          parsed.tableColumns = DEFAULT_TABLE_COLUMNS;
        }
        if (parsed.portalSettings) {
          parsed.portalSettings.attorneyName = parsed.portalSettings.attorneyName || "FARHEEN MUSHIR";
          parsed.portalSettings.attorneyNumber = parsed.portalSettings.attorneyNumber || "50565";
        }
        globalThis.__PORTAL_DB__ = parsed;
        return parsed;
      }
    }

    // 2. Try reading from /tmp/db.json (serverless disk)
    if (fs.existsSync(TMP_DB_FILE)) {
      const raw = fs.readFileSync(TMP_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as FullPortalData;
      if (parsed && Array.isArray(parsed.payments)) {
        if (!parsed.tableColumns || !Array.isArray(parsed.tableColumns) || parsed.tableColumns.length === 0) {
          parsed.tableColumns = DEFAULT_TABLE_COLUMNS;
        }
        if (parsed.portalSettings) {
          parsed.portalSettings.attorneyName = parsed.portalSettings.attorneyName || "FARHEEN MUSHIR";
          parsed.portalSettings.attorneyNumber = parsed.portalSettings.attorneyNumber || "50565";
        }
        globalThis.__PORTAL_DB__ = parsed;
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading DB data:', error);
  }

  if (globalThis.__PORTAL_DB__) {
    return globalThis.__PORTAL_DB__;
  }

  globalThis.__PORTAL_DB__ = INITIAL_DATA;
  return INITIAL_DATA;
}

export function saveDbData(data: FullPortalData): void {
  // Always update in-memory cache instantly so GET /api/v1/public-data immediately returns updated data
  globalThis.__PORTAL_DB__ = data;

  // 1. Save to Firebase Firestore asynchronously
  saveFirebaseData(data).catch(err => console.error('Firebase save error:', err));

  // 2. Write to /tmp/db.json (always writable in Vercel Serverless Functions)
  try {
    fs.writeFileSync(TMP_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to /tmp/db.json:', err);
  }

  // 3. Write to project data/db.json (writable in local development)
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Ignore EROFS error on Vercel production serverless filesystem
  }
}
