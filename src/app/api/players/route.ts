import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/players
export async function GET() {
  const players = await prisma.players.findMany({
    select: {
      id: true,
      name: true,
      avatar_url: true,
    },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ players });
}
