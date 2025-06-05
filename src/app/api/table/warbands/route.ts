import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  // Публічний endpoint: повертає всі не видалені варбанди з гравцем, аватаром та іграми
  const warbands = await prisma.warbands.findMany({
    where: { status: { not: 'deleted' } },
    include: {
      players: { select: { id: true, name: true, avatar_url: true } },
      games_games_warband_1_idTowarbands: {
        include: {
          warbands_games_warband_2_idTowarbands: { select: { name: true } },
        },
      },
      games_games_warband_2_idTowarbands: {
        include: {
          warbands_games_warband_1_idTowarbands: { select: { name: true } },
        },
      },
    },
    orderBy: { id: 'desc' },
  });

  // Отримаємо всі ігри одним запитом
  const allGames = await prisma.games.findMany({
    where: { status: { in: ['finished', 'planned', 'active', 'pending_approval'] } },
    select: {
      id: true,
      status: true,
      warband_1_id: true,
      warband_2_id: true,
      warband_1_gameNumber: true,
      warband_2_gameNumber: true,
      vp_1: true,
      vp_2: true,
      gp_1: true,
      gp_2: true,
      warbands_games_warband_1_idTowarbands: { select: { name: true } },
      warbands_games_warband_2_idTowarbands: { select: { name: true } },
    }
  });

  // Якщо у warbands є rosters, уніфікуємо file_url
  const result = warbands.map((w: any) => {
    const rosters = (w.rosters || []).map((r: any) => ({
      ...r,
      file_url: r.id ? `/api/roster?roster_id=${r.id}` : null
    }));

    // Збираємо всі ігри цієї варбанди
    const games = allGames.filter(
      (g: any) => g.warband_1_id === w.id || g.warband_2_id === w.id
    ).map((g: any) => {
      const is1 = g.warband_1_id === w.id;
      return {
        id: g.id,
        number: is1 ? g.warband_1_gameNumber : g.warband_2_gameNumber,
        status: g.status,
        opponent: is1
          ? g.warbands_games_warband_2_idTowarbands?.name || ''
          : g.warbands_games_warband_1_idTowarbands?.name || '',
        vp: is1 ? g.vp_1 : g.vp_2,
        gp: is1 ? g.gp_1 : g.gp_2,
        opponent_vp: is1 ? g.vp_2 : g.vp_1,
        opponent_gp: is1 ? g.gp_2 : g.gp_1,
      };
    });

    // Додаємо total_vp для кожної варбанди
    const total_vp = games.reduce((sum: number, g: any) => sum + (typeof g.vp === 'number' ? g.vp : 0), 0);
    return {
      ...w,
      rosters,
      games,
      total_vp,
    };
  });

  return NextResponse.json({ warbands: result });
}
