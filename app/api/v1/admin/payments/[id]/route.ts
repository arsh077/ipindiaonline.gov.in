import { NextRequest, NextResponse } from 'next/server';
import { getDbDataAsync, saveDbData } from '@/lib/db';
import { fail, ok, requireAdmin } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = requireAdmin(req); if (access.response) return access.response;

  const { id } = await params;
  if (!id || id.length > 100) return fail('Invalid payment id');
  const db = await getDbDataAsync();
  if (!db.payments.some(p => p.id === id)) return fail('Payment not found', 404);
  db.payments = db.payments.filter(p => p.id !== id);

  // Re-index sNo
  db.payments.forEach((item, index) => {
    item.sNo = index + 1;
  });

  await saveDbData(db);

  return ok(db.payments, 'Payment deleted successfully');
}
