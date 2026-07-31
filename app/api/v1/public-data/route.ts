import { NextResponse } from 'next/server';
import { getDbData } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const db = getDbData();
  return NextResponse.json({
    success: true,
    message: "Portal data fetched successfully",
    data: {
      portalSettings: db.portalSettings,
      payments: db.payments,
      tableColumns: db.tableColumns,
      terms: db.terms,
      redirectURL: db.settings.redirectURL
    }
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
}
