import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDbDataAsync, saveDbData } from '@/lib/db';
import { fail, ok, readJson, requireAdmin, serverError } from '@/lib/api';
import { isRecord, text } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(req: NextRequest) {
  const access = requireAdmin(req); if (access.response) return access.response;

  try {
    const parsed = await readJson(req); if (parsed.response) return parsed.response;
    if (!isRecord(parsed.data)) return fail('Request body must be an object');
    const { newUsername, newPassword } = parsed.data;

    const db = await getDbDataAsync();
    if (newUsername !== undefined) {
      const username = text(newUsername, 'Username', 64, true)!;
      if (!/^[a-zA-Z0-9_.-]+$/.test(username)) return fail('Username may contain only letters, numbers, dots, underscores, and hyphens');
      db.admin.username = username;
    }
    if (newPassword !== undefined) {
      const password = text(newPassword, 'Password', 128, true)!;
      if (password.length < 12) return fail('Password must be at least 12 characters');
      db.admin.passwordHash = await bcrypt.hash(password, 12);
    }
    if (newUsername === undefined && newPassword === undefined) return fail('Provide a username or password');

    saveDbData(db);

    return ok({ username: db.admin.username }, 'Admin credentials updated successfully');
  } catch (err) {
    return err instanceof Error ? fail(err.message) : serverError(err);
  }
}
