import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: отримати всі оповідання та ігри для варбанди
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const warbandId = Number(params.id);
  if (!warbandId) return NextResponse.json({ error: 'Missing warband id' }, { status: 400 });
  const warband = await prisma.warbands.findUnique({
    where: { id: warbandId },
    include: {
      stories: true,
      games_games_warband_1_idTowarbands: {
        include: { warbands_games_warband_2_idTowarbands: { select: { name: true } } },
      },
      games_games_warband_2_idTowarbands: {
        include: { warbands_games_warband_1_idTowarbands: { select: { name: true } } },
      },
    },
  });
  if (!warband) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Збираємо ігри
  const games: any[] = [];
  (warband.games_games_warband_1_idTowarbands || []).forEach((g: any) => {
    games.push({
      id: g.id,
      number: g.warband_1_gameNumber,
      status: g.status,
      opponent: g.warbands_games_warband_2_idTowarbands?.name || '',
      vp: g.vp_1,
      gp: g.gp_1,
      opponent_vp: g.vp_2,
      opponent_gp: g.gp_2,
    });
  });
  (warband.games_games_warband_2_idTowarbands || []).forEach((g: any) => {
    games.push({
      id: g.id,
      number: g.warband_2_gameNumber,
      status: g.status,
      opponent: g.warbands_games_warband_1_idTowarbands?.name || '',
      vp: g.vp_2,
      gp: g.gp_2,
      opponent_vp: g.vp_1,
      opponent_gp: g.gp_1,
    });
  });
  // Оповідання: масив {number, html}
  const stories = (warband.stories || []).map((s: any) => ({ number: s.game_id ?? 0, html: s.text || '' }));
  return NextResponse.json({ stories, games });
}

// PATCH: зберегти/оновити оповідання для warband+game_number
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const warbandId = Number(params.id);
  if (!warbandId) return NextResponse.json({ error: 'Missing warband id' }, { status: 400 });
  const body = await req.json();
  const { number, html } = body;
  if (typeof number !== 'number') return NextResponse.json({ error: 'Missing number' }, { status: 400 });
  // Оновити або створити
  const existing = await prisma.stories.findFirst({ where: { warband_id: warbandId, game_id: number } });
  if (existing) {
    await prisma.stories.update({ where: { id: existing.id }, data: { text: html } });
  } else {
    await prisma.stories.create({ data: { warband_id: warbandId, game_id: number, text: html } });
  }
  // Повернути оновлений масив
  const all = await prisma.stories.findMany({ where: { warband_id: warbandId } });
  const stories = all.map((s: any) => ({ number: s.game_id ?? 0, html: s.text || '' }));
  return NextResponse.json({ stories });
}
