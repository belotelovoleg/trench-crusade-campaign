import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  // Try to find player by avatar_url (filename)
  const player = await prisma.players.findFirst({
    where: { avatar_url: params.filename },
    select: { avatar: true, avatar_url: true },
  });

  if (player && player.avatar) {
    // Try to detect content type from base64 header or filename
    let contentType = 'image/jpeg';
    const base64 = player.avatar;
    let base64Data = base64;
    const match = base64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
    if (match) {
      contentType = match[1];
      base64Data = match[2];
    } else if (params.filename.match(/\.png$/i)) contentType = 'image/png';
    else if (params.filename.match(/\.gif$/i)) contentType = 'image/gif';
    else if (params.filename.match(/\.webp$/i)) contentType = 'image/webp';
    else if (params.filename.match(/\.(jpg|jpeg)$/i)) contentType = 'image/jpeg';
    const buffer = Buffer.from(base64Data, 'base64');
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  // No avatar found in DB, serve default PNG
  const defaultPngPath = path.join(process.cwd(), 'public', 'default_avatar.png');
  try {
    const buffer = await fs.readFile(defaultPngPath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e) {
    return new NextResponse('Not found', { status: 404 });
  }
}
