import { NextRequest } from 'next/server';
import { getDbDataAsync, saveDbData } from '@/lib/db';
import { ok, requireAdmin, serverError } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const access = requireAdmin(req);
  if (access.response) return access.response;

  try {
    const db = await getDbDataAsync();
    const cleanDb = JSON.parse(JSON.stringify(db));
    await saveDbData(cleanDb);
    return ok(cleanDb, 'Database hard purged & completely overwritten!', 200);
  } catch (err) {
    return err instanceof Error ? ok(null, err.message) : serverError(err);
  }
}
