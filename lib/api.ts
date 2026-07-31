import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth';

export const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export function ok(data: unknown, message?: string, status = 200) {
  return NextResponse.json({ success: true, ...(message ? { message } : {}), data }, {
    status,
    headers: noStoreHeaders,
  });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status, headers: noStoreHeaders });
}

export function serverError(error: unknown) {
  console.error('API error:', error);
  return fail('The request could not be completed. Please try again.', 500);
}

/** All write routes require an authenticated same-origin administrator session. */
export function requireAdmin(request: NextRequest) {
  const auth = getAdminAuth(request);
  if (!auth) return { auth: null, response: fail('Unauthorized', 401) };

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return { auth: null, response: fail('Invalid request origin', 403) };
      }
    } catch {
      return { auth: null, response: fail('Invalid request origin', 403) };
    }
  }
  return { auth, response: null };
}

export async function readJson(request: NextRequest): Promise<{ data?: unknown; response?: NextResponse }> {
  try {
    return { data: await request.json() };
  } catch {
    return { response: fail('Request body must be valid JSON') };
  }
}
