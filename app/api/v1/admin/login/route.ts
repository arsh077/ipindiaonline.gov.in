import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDbData } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 }
      );
    }

    const db = getDbData();
    if (username !== db.admin.username) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, db.admin.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = signToken(username);

    const res = NextResponse.json({
      success: true,
      message: "Admin authentication successful",
      data: {
        token,
        username: db.admin.username
      }
    });

    res.cookies.set('admin_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400 // 1 day
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Login failed" },
      { status: 500 }
    );
  }
}
