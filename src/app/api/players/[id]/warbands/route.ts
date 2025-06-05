import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/players/[id]/warbands
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const playerId = Number(params.id);
  if (!playerId) return NextResponse.json({ error: 'player id required' }, { status: 400 });

  const warbands = await prisma.warbands.findMany({
    where: { player_id: playerId, status: 'active' },
    select: {
      id: true,
      name: true,
      catalogue_name: true,
      rosters: {
        select: {
          id: true,
          file_url: true,
          model_count: true,
          ducats: true,
          glory_points: true,
        },
        orderBy: { id: 'desc' },
      },
    },
    orderBy: { id: 'asc' },
  });
  return NextResponse.json({ warbands });
}
