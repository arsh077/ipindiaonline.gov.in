import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAdminAuth } from '@/lib/auth';
import { getDbData, saveDbData } from '@/lib/db';

export async function PUT(req: NextRequest) {
  const auth = getAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { newUsername, newPassword } = body;

    const db = getDbData();
    if (newUsername && newUsername.trim()) {
      db.admin.username = newUsername.trim();
    }
    if (newPassword && newPassword.trim()) {
      db.admin.passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    }

    saveDbData(db);

    return NextResponse.json({
      success: true,
      message: "Admin credentials updated successfully",
      data: { username: db.admin.username }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
