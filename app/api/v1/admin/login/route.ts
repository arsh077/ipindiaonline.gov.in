import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDbData } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { fail, ok, readJson, serverError } from '@/lib/api';

const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const client = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
    const entry = attempts.get(client);
    if (entry && entry.resetAt > Date.now() && entry.count >= 5) return fail('Too many login attempts. Try again in 15 minutes.', 429);
    const parsed = await readJson(req);
    if (parsed.response) return parsed.response;
    const body = parsed.data as { username?: unknown; password?: unknown };
    const { username, password } = body;

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) return fail('Username and password are required');

    const db = getDbData();
    if (username !== db.admin.username) {
      attempts.set(client, { count: (entry?.count || 0) + 1, resetAt: Date.now() + 15 * 60 * 1000 });
      return fail('Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, db.admin.passwordHash);
    if (!isMatch) {
      attempts.set(client, { count: (entry?.count || 0) + 1, resetAt: Date.now() + 15 * 60 * 1000 });
      return fail('Invalid credentials', 401);
    }

    const token = signToken(username);

    attempts.delete(client);
    const res = ok({ username: db.admin.username, token }, 'Admin authentication successful');

    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60,
      path: '/',
    });

    return res;
  } catch (error) {
    return serverError(error);
  }
}
