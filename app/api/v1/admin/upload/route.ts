import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, fail, ok, serverError } from '@/lib/api';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(req: NextRequest) {
  const access = requireAdmin(req);
  if (access.response) return access.response;

  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const contentType = req.headers.get('content-type') || '';

    let filename = '';
    let buffer: Buffer;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const type = (formData.get('type') as string) || 'upload';

      if (!file) {
        return fail('No file uploaded');
      }

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || '.png';
      const cleanName = type ? `${type}-${Date.now()}${ext}` : `file-${Date.now()}${ext}`;
      filename = cleanName;
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      const { base64Data, type = 'upload', originalName } = body;

      if (!base64Data) {
        return fail('No base64 data provided');
      }

      // Format: data:image/png;base64,xxxx...
      const matches = base64Data.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (!matches) {
        return fail('Invalid base64 format');
      }

      const mimeType = matches[1];
      const dataStr = matches[2];
      buffer = Buffer.from(dataStr, 'base64');

      let ext = '.png';
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = '.jpg';
      if (mimeType.includes('svg')) ext = '.svg';
      if (mimeType.includes('webp')) ext = '.webp';

      filename = `${type}-${Date.now()}${ext}`;
    } else {
      return fail('Unsupported content type');
    }

    const filePath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;
    return ok({ url: publicUrl, filename }, 'File uploaded and saved permanently to disk');
  } catch (err) {
    return err instanceof Error ? fail(err.message) : serverError(err);
  }
}
