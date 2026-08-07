import { NextRequest, NextResponse } from 'next/server';
import { getDbDataAsync } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session') || searchParams.get('id');

  const db = await getDbDataAsync();

  let targetSettings = db.portalSettings;
  let targetPayments = db.payments;
  let targetColumns = db.tableColumns;
  let targetTerms = db.terms;
  let targetRedirect = db.settings.redirectURL;

  if (sessionId && db.sessions && db.sessions[sessionId]) {
    const session = db.sessions[sessionId];
    targetSettings = session.portalSettings || targetSettings;
    targetPayments = session.payments || targetPayments;
    targetColumns = session.tableColumns || targetColumns;
    targetTerms = session.terms || targetTerms;
    targetRedirect = session.settings?.redirectURL || targetRedirect;
  }

  return NextResponse.json({
    success: true,
    message: "Portal data fetched successfully",
    data: {
      portalSettings: targetSettings,
      payments: targetPayments,
      tableColumns: targetColumns,
      terms: targetTerms,
      redirectURL: targetRedirect
    }
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
}
