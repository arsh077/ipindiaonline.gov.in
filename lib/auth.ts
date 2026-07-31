import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const fallbackSecret = 'trademarkapply_gov_portal_cms_secret_2026';
const JWT_SECRET = process.env.JWT_SECRET || fallbackSecret;

export interface TokenPayload {
  username: string;
  role: string;
}

export function signToken(username: string): string {
  return jwt.sign({ username, role: 'admin' }, JWT_SECRET, {
    expiresIn: '8h',
    issuer: 'trademarkapply-cms',
    audience: 'admin',
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'trademarkapply-cms',
      audience: 'admin',
    }) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export function getAdminAuth(req: NextRequest): TokenPayload | null {
  const authHeader = req.headers.get('authorization');
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Check cookie
    const cookieToken = req.cookies.get('admin_token')?.value;
    if (cookieToken) {
      token = cookieToken;
    }
  }

  if (!token) return null;
  return verifyToken(token);
}
