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

  const result = warbands.map((w: any) => {
    // Для цієї warband шукаємо всі ігри, де вона warband_1 або warband_2
    const games: any[] = [];
    allGames.forEach((g: any) => {
      if (g.warband_1_id === w.id) {
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
      }
      if (g.warband_2_id === w.id) {
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
      }
    });
    return {
      id: w.id,
      name: w.name,
      status: w.status,
      player: w.players,
      catalogue_name: w.catalogue_name,
      games,
    };
  });

  return NextResponse.json({ warbands: result });
}
