import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth';
import { getDbData, saveDbData } from '@/lib/db';
import { PaymentItem } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const db = getDbData();
  return NextResponse.json({
    success: true,
    data: db.payments
  });
}

export async function POST(req: NextRequest) {
  const auth = getAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { formNumber, applicationNumber, referenceNumber, classes, branch, price } = body;

    const db = getDbData();
    const newId = `pay-${Date.now()}`;
    const newRow: PaymentItem = {
      id: newId,
      sNo: db.payments.length + 1,
      formNumber: formNumber || 'TM-A',
      applicationNumber: applicationNumber || '',
      referenceNumber: referenceNumber || '',
      classes: classes || '',
      branch: branch || 'DELHI',
      price: Number(price) || 0
    };

    db.payments.push(newRow);
    // re-index sNo
    db.payments.forEach((item, index) => {
      item.sNo = index + 1;
    });

    saveDbData(db);

    return NextResponse.json({
      success: true,
      message: "Payment item created successfully",
      data: db.payments
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = getAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const db = getDbData();

    if (Array.isArray(body)) {
      // replace whole array
      db.payments = body.map((item, idx) => ({
        ...item,
        sNo: idx + 1,
        price: Number(item.price) || 0
      }));
    } else if (body.id) {
      // update single row
      const idx = db.payments.findIndex(p => p.id === body.id);
      if (idx !== -1) {
        db.payments[idx] = {
          ...db.payments[idx],
          formNumber: body.formNumber ?? db.payments[idx].formNumber,
          applicationNumber: body.applicationNumber ?? db.payments[idx].applicationNumber,
          referenceNumber: body.referenceNumber ?? db.payments[idx].referenceNumber,
          classes: body.classes ?? db.payments[idx].classes,
          branch: body.branch ?? db.payments[idx].branch,
          price: body.price !== undefined ? Number(body.price) : db.payments[idx].price
        };
      }
    }

    saveDbData(db);

    return NextResponse.json({
      success: true,
      message: "Payments updated successfully",
      data: db.payments
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
