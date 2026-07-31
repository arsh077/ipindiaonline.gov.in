import { NextRequest, NextResponse } from 'next/server';
import { getDbData, saveDbData } from '@/lib/db';
import { fail, ok, readJson, requireAdmin, serverError } from '@/lib/api';
import { terms } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(req: NextRequest) {
  const access = requireAdmin(req); if (access.response) return access.response;

  try {
    const parsed = await readJson(req); if (parsed.response) return parsed.response;
    const db = getDbData();
    db.terms = terms(parsed.data);
    saveDbData(db);

    return ok(db.terms, 'Terms updated successfully');
  } catch (err) {
    return err instanceof Error ? fail(err.message) : serverError(err);
  }
}
