import { NextRequest, NextResponse } from 'next/server';
import { getDbDataAsync, saveDbData } from '@/lib/db';
import { fail, ok, readJson, requireAdmin, serverError } from '@/lib/api';
import { isRecord, url } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(req: NextRequest) {
  const access = requireAdmin(req); if (access.response) return access.response;

  try {
    const parsed = await readJson(req); if (parsed.response) return parsed.response;
    if (!isRecord(parsed.data)) return fail('Request body must be an object');

    const db = await getDbDataAsync();
    db.settings.redirectURL = url(parsed.data.redirectURL, 'redirectURL');
    saveDbData(db);

    return ok(db.settings, 'Redirect URL updated successfully');
  } catch (err) {
    return err instanceof Error ? fail(err.message) : serverError(err);
  }
}
