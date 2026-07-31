import { NextRequest, NextResponse } from 'next/server';
import { getDbData, saveDbData } from '@/lib/db';
import { fail, ok, readJson, requireAdmin, serverError } from '@/lib/api';
import { portalSettings } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(req: NextRequest) {
  const access = requireAdmin(req); if (access.response) return access.response;

  try {
    const parsed = await readJson(req); if (parsed.response) return parsed.response;
    const db = getDbData();
    db.portalSettings = portalSettings(parsed.data, db.portalSettings);

    saveDbData(db);

    return ok(db.portalSettings, 'Header settings updated successfully');
  } catch (err) {
    return err instanceof Error ? fail(err.message) : serverError(err);
  }
}
