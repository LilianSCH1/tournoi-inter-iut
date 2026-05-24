import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'devis');

function safeFilename(filename: string): string {
  const parsed = path.parse(filename);
  const base = parsed.name
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'document';
  const ext = parsed.ext.toLowerCase();
  const suffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  return `${base}-${suffix}${ext}`;
}

export async function POST(request: Request) {
  try {
    const origin = new URL(request.url).origin;
    const formData = await request.formData();
    const files = formData.getAll('files').filter((item): item is File => item instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const savedFiles = [] as Array<{ url: string; filename: string; size: number; type: string }>;

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = safeFilename(file.name || 'document');
      const filePath = path.join(UPLOAD_DIR, filename);
      await writeFile(filePath, buffer);

      savedFiles.push({
        url: `${origin}/uploads/devis/${filename}`,
        filename: file.name || filename,
        size: file.size,
        type: file.type || 'application/octet-stream',
      });
    }

    return NextResponse.json({ success: true, files: savedFiles });
  } catch (error) {
    console.error('Erreur upload devis:', error);
    return NextResponse.json({ error: 'Upload impossible' }, { status: 500 });
  }
}
