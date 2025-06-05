import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

const maxSize = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('auth');
  if (!auth?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // (Можна додати перевірку is_admin через prisma, якщо потрібно)

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (file.size > maxSize) return NextResponse.json({ error: 'File too large' }, { status: 400 });

  const ext = path.extname(file.name).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `about_${Date.now()}${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'about');
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, buffer);
  const url = `/about/${fileName}`;
  return NextResponse.json({ url });
}
