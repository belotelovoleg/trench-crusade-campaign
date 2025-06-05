import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { createReadStream, existsSync, statSync } from 'fs';

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const filePath = join(process.cwd(), 'public', 'avatars', params.filename);

  if (!existsSync(filePath)) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Визначаємо content-type за розширенням
  let contentType = 'application/octet-stream';
  if (params.filename.match(/\.(jpg|jpeg)$/i)) contentType = 'image/jpeg';
  else if (params.filename.match(/\.png$/i)) contentType = 'image/png';
  else if (params.filename.match(/\.gif$/i)) contentType = 'image/gif';
  else if (params.filename.match(/\.webp$/i)) contentType = 'image/webp';

  const stat = statSync(filePath);
  const stream = createReadStream(filePath);
  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': stat.size.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
