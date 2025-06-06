import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/players
export async function GET() {
  const players = await prisma.players.findMany({
    select: {
      id: true,
      name: true,
      login: true,
      avatar_url: true,
      notes: true,
      warbands: {
        select: {
          id: true,
          name: true,
          status: true,
          catalogue_name: true,
          rosters: {
            select: {
              id: true,
              ducats: true,
              model_count: true,
              glory_points: true,
              game_number: true,
            },
            orderBy: { game_number: 'asc' },
          },
        },
        where: { status: { not: 'deleted' } },
        orderBy: { id: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ players });
}
