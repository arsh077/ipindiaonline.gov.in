import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth';
import { getDbData, saveDbData } from '@/lib/db';

export async function PUT(req: NextRequest) {
  const auth = getAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { redirectURL } = body;

    if (!redirectURL) {
      return NextResponse.json({ success: false, message: "redirectURL is required" }, { status: 400 });
    }

    const db = getDbData();
    db.settings.redirectURL = redirectURL;
    saveDbData(db);

    return NextResponse.json({
      success: true,
      message: "Redirect URL updated successfully",
      data: db.settings
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
