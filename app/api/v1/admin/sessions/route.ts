import { NextRequest, NextResponse } from 'next/server';
import { getDbDataAsync, saveDbData } from '@/lib/db';
import { fail, ok, readJson, requireAdmin, serverError } from '@/lib/api';
import { PortalSession } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const access = requireAdmin(req);
  if (access.response) return access.response;

  const db = await getDbDataAsync();
  const sessions = Object.values(db.sessions || {});
  return ok(sessions);
}

export async function POST(req: NextRequest) {
  const access = requireAdmin(req);
  if (access.response) return access.response;

  try {
    const parsed = await readJson(req);
    if (parsed.response) return parsed.response;

    const { clientName, payments, portalSettings } = (parsed.data as any) || {};
    const db = await getDbDataAsync();

    const randomTag = Math.random().toString(36).substring(2, 8);
    const sessionId = `link_${Date.now().toString(36)}_${randomTag}`;

    const newSession: PortalSession = {
      id: sessionId,
      clientName: clientName || `Client-${randomTag.toUpperCase()}`,
      createdAt: new Date().toISOString(),
      portalSettings: portalSettings || db.portalSettings,
      payments: Array.isArray(payments) && payments.length > 0 ? payments : db.payments,
      tableColumns: db.tableColumns,
      terms: db.terms,
      settings: db.settings
    };

    if (!db.sessions) {
      db.sessions = {};
    }

    db.sessions[sessionId] = newSession;
    await saveDbData(db);

    return ok(newSession, 'New Client Link Generated Successfully', 201);
  } catch (err) {
    return err instanceof Error ? fail(err.message) : serverError(err);
  }
}

export async function DELETE(req: NextRequest) {
  const access = requireAdmin(req);
  if (access.response) return access.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return fail('Session ID required');

    const db = await getDbDataAsync();
    if (db.sessions && db.sessions[id]) {
      delete db.sessions[id];
      await saveDbData(db);
    }

    return ok(Object.values(db.sessions || {}), 'Session deleted successfully');
  } catch (err) {
    return err instanceof Error ? fail(err.message) : serverError(err);
  }
}
