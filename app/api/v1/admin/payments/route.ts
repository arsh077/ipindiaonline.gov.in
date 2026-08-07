import { NextRequest, NextResponse } from 'next/server';
import { getDbDataAsync, saveDbData } from '@/lib/db';
import { PaymentItem } from '@/lib/types';
import { fail, ok, readJson, requireAdmin, serverError } from '@/lib/api';
import { isRecord, payment, payments } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const db = await getDbDataAsync();
  return ok(db.payments);
}

export async function POST(req: NextRequest) {
  const access = requireAdmin(req); if (access.response) return access.response;

  try {
    const parsed = await readJson(req); if (parsed.response) return parsed.response;
    if (!isRecord(parsed.data)) return fail('Request body must be an object');

    const db = await getDbDataAsync();
    const newRow: PaymentItem = payment(parsed.data, crypto.randomUUID(), db.payments.length + 1);

    db.payments.push(newRow);
    // re-index sNo
    db.payments.forEach((item, index) => {
      item.sNo = index + 1;
    });

    await saveDbData(db);

    return ok(db.payments, 'Payment item created successfully', 201);
  } catch (err) {
    return err instanceof Error ? fail(err.message) : serverError(err);
  }
}

export async function PUT(req: NextRequest) {
  const access = requireAdmin(req); if (access.response) return access.response;

  try {
    const parsed = await readJson(req); if (parsed.response) return parsed.response;
    const body = parsed.data;
    const db = await getDbDataAsync();

    if (Array.isArray(body)) {
      // replace whole array
      db.payments = payments(body);
    } else if (isRecord(body) && typeof body.id === 'string') {
      // update single row
      const idx = db.payments.findIndex(p => p.id === body.id);
      if (idx !== -1) {
        db.payments[idx] = payment({ ...db.payments[idx], ...body }, body.id, idx + 1);
      } else {
        return fail('Provide a payment row or an array of payment rows');
      }
    }

    await saveDbData(db);

    return ok(db.payments, 'Payments updated successfully');
  } catch (err) {
    return err instanceof Error ? fail(err.message) : serverError(err);
  }
}
