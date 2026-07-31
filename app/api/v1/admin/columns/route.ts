import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth';
import { getDbData, saveDbData, DEFAULT_TABLE_COLUMNS } from '@/lib/db';
import { TableColumn } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const db = getDbData();
  return NextResponse.json({
    success: true,
    data: db.tableColumns || DEFAULT_TABLE_COLUMNS
  });
}

export async function PUT(req: NextRequest) {
  const auth = getAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, message: "Expected array of TableColumns" }, { status: 400 });
    }

    const db = getDbData();
    db.tableColumns = body as TableColumn[];
    saveDbData(db);

    return NextResponse.json({
      success: true,
      message: "Table columns updated successfully",
      data: db.tableColumns
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
