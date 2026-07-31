import { NextResponse } from 'next/server';
import { getDbData } from '@/lib/db';

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
  });
}
