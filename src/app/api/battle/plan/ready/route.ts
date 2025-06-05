import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

// PATCH /api/battle/plan/ready
export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('auth');
  if (!auth?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.players.findUnique({ where: { login: auth.value } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { game_id } = body;
  if (!game_id) return NextResponse.json({ error: 'Missing game_id' }, { status: 400 });

  const game = await prisma.games.findUnique({ where: { id: game_id }, select: { id: true, warband_1_id: true, warband_2_id: true, player1_isReady: true, player2_isReady: true, status: true } });
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  // Determine if user is player1 or player2
  const myWarband = await prisma.warbands.findFirst({ where: { player_id: user.id, id: { in: [game.warband_1_id, game.warband_2_id] } } });
  if (!myWarband) return NextResponse.json({ error: 'Not your game' }, { status: 403 });

  let update: any = {};
  if (myWarband.id === game.warband_1_id) {
    update.player1_isReady = true;
  } else if (myWarband.id === game.warband_2_id) {
    update.player2_isReady = true;
  } else {
    return NextResponse.json({ error: 'Not your game' }, { status: 403 });
  }

  // If both ready, set status to 'active'
  if ((myWarband.id === game.warband_1_id && game.player2_isReady) || (myWarband.id === game.warband_2_id && game.player1_isReady)) {
    update.status = 'active';
  }

  const updated = await prisma.games.update({ where: { id: game_id }, data: update });
  return NextResponse.json({ success: true, game: updated });
}
