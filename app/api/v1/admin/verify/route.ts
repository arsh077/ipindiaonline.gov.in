import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth';
import { getDbData } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = getAdminAuth(req);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const db = getDbData();
  return NextResponse.json({
    success: true,
    message: "Admin session verified",
    data: {
      username: auth.username,
      portalSettings: db.portalSettings,
      payments: db.payments,
      terms: db.terms,
      redirectURL: db.settings.redirectURL
    }
  });
}
