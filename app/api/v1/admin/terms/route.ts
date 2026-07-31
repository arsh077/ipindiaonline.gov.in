import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth';
import { getDbData, saveDbData } from '@/lib/db';
import { TermSection } from '@/lib/types';

export async function PUT(req: NextRequest) {
  const auth = getAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const db = getDbData();

    if (Array.isArray(body)) {
      db.terms = body.map((item, idx) => ({
        id: item.id || `term-${idx + 1}`,
        order: idx + 1,
        title: item.title,
        description: item.description
      }));
      saveDbData(db);
    }

    return NextResponse.json({
      success: true,
      message: "Terms updated successfully",
      data: db.terms
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
