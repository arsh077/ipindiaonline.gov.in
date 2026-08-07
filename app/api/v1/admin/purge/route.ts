import { NextRequest, NextResponse } from 'next/server';
import { getDbDataAsync, saveDbData } from '@/lib/db';
import { ok, requireAdmin, serverError } from '@/lib/api';
import { saveFirebaseData } from '@/lib/firebase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const access = requireAdmin(req);
  if (access.response) return access.response;

  try {
    const db = await getDbDataAsync();
    
    // 1. Hard purge DB object
    const cleanDb = JSON.parse(JSON.stringify(db));
    
    // 2. Save and force overwrite local DB and Firestore
    await saveDbData(cleanDb);
    await saveFirebaseData(cleanDb);

    return ok(cleanDb, 'Database and Firebase Cloud completely purged & hard overwritten!', 200);
  } catch (err) {
    return err instanceof Error ? ok(null, err.message) : serverError(err);
  }
}
