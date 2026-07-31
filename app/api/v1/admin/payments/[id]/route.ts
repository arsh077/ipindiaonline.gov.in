import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth';
import { getDbData, saveDbData } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDbData();
  db.payments = db.payments.filter(p => p.id !== id);

  // Re-index sNo
  db.payments.forEach((item, index) => {
    item.sNo = index + 1;
  });

  saveDbData(db);

  return NextResponse.json({
    success: true,
    message: "Payment deleted successfully",
    data: db.payments
  });
}
