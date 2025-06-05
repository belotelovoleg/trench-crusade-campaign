import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/games
export async function GET() {
  try {
    const games = await prisma.games.findMany({
      orderBy: { id: 'desc' },
      include: {
        warbands_games_warband_1_idTowarbands: {
          include: {
            players: true,
          },
        },
        warbands_games_warband_2_idTowarbands: {
          include: {
            players: true,
          },
        },
      },
    });
    return NextResponse.json({ games });
  } catch (error) {
    return NextResponse.json({ code: 'db', reason: 'DB error', error: String(error) }, { status: 500 });
  }
}

// DELETE /api/admin/games
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ code: 'missing_param', reason: 'Missing game id' }, { status: 400 });
  try {
    await prisma.games.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ code: 'db', reason: 'DB error', error: String(error) }, { status: 500 });
  }
}

// PATCH /api/admin/games
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updateFields } = body;
    if (!id) return NextResponse.json({ code: 'missing_param', reason: 'Missing game id' }, { status: 400 });
    const updated = await prisma.games.update({
      where: { id: Number(id) },
      data: updateFields,
    });
    return NextResponse.json({ ok: true, updated });
  } catch (error) {
    return NextResponse.json({ code: 'db', reason: 'DB error', error: String(error) }, { status: 500 });
  }
}
