import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth';
import { getDbData, saveDbData } from '@/lib/db';

export async function PUT(req: NextRequest) {
  const auth = getAdminAuth(req);
  if (!auth) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { logo, emblemImage, headerBanner, organizationName, departmentName, attorneyName, attorneyNumber } = body;

    const db = getDbData();
    db.portalSettings = {
      logo: logo ?? db.portalSettings.logo,
      emblemImage: emblemImage !== undefined ? emblemImage : db.portalSettings.emblemImage,
      headerBanner: headerBanner !== undefined ? headerBanner : db.portalSettings.headerBanner,
      organizationName: organizationName ?? db.portalSettings.organizationName,
      departmentName: departmentName ?? db.portalSettings.departmentName,
      attorneyName: attorneyName ?? db.portalSettings.attorneyName,
      attorneyNumber: attorneyNumber ?? db.portalSettings.attorneyNumber,
    };

    saveDbData(db);

    return NextResponse.json({
      success: true,
      message: "Header settings updated successfully",
      data: db.portalSettings
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to update header" }, { status: 500 });
  }
}
