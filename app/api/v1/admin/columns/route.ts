import { NextRequest, NextResponse } from 'next/server';
import { getDbDataAsync, saveDbData, DEFAULT_TABLE_COLUMNS } from '@/lib/db';
import { fail, ok, readJson, requireAdmin, serverError } from '@/lib/api';
import { columns } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const db = await getDbDataAsync();
  return ok(db.tableColumns || DEFAULT_TABLE_COLUMNS);
}

export async function PUT(req: NextRequest) {
  const access = requireAdmin(req); if (access.response) return access.response;

  try {
    const parsed = await readJson(req); if (parsed.response) return parsed.response;

    const db = await getDbDataAsync();
    db.tableColumns = columns(parsed.data);
    saveDbData(db);

    return ok(db.tableColumns, 'Table columns updated successfully');
  } catch (err) {
    return err instanceof Error ? fail(err.message) : serverError(err);
  }
}
