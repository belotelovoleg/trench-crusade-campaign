import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/battle?warband_id=ID
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const warbandId = Number(searchParams.get('warband_id'));
  if (!warbandId) return NextResponse.json({ error: 'warband_id required' }, { status: 400 });

  // Отримати варбанду
  const warband = await prisma.warbands.findUnique({
    where: { id: warbandId },
    include: {
      players: { select: { id: true, name: true, avatar_url: true } },
      rosters: { select: { id: true, file_url: true, model_count: true, ducats: true, glory_points: true } },
    },
  });
  if (!warband) return NextResponse.json({ error: 'Warband not found' }, { status: 404 });

  // Всі ігри цієї варбанди (де вона warband_1 або warband_2)
  const games = await prisma.games.findMany({
    where: {
      OR: [
        { warband_1_id: warbandId },
        { warband_2_id: warbandId },
      ],
    },
    include: {
      warbands_games_warband_1_idTowarbands: {
        select: {
          id: true,
          name: true,
          catalogue_name: true,
          players: { select: { id: true, name: true, avatar_url: true } },
          rosters: { select: { id: true, file_url: true, model_count: true, ducats: true, glory_points: true } },
        }
      },
      warbands_games_warband_2_idTowarbands: {
        select: {
          id: true,
          name: true,
          catalogue_name: true,
          players: { select: { id: true, name: true, avatar_url: true } },
          rosters: { select: { id: true, file_url: true, model_count: true, ducats: true, glory_points: true } },
        }
      }
    },
    orderBy: { id: 'asc' },
  });

  // Attach modelCount, ducats, and gloryPoints to each warband in each game (from the latest roster)
  for (const g of games) {
    if (g.warbands_games_warband_1_idTowarbands && g.warbands_games_warband_1_idTowarbands.rosters.length > 0) {
      const r = g.warbands_games_warband_1_idTowarbands.rosters[0];
      (g.warbands_games_warband_1_idTowarbands as any).modelCount = r.model_count || 0;
      (g.warbands_games_warband_1_idTowarbands as any).ducats = r.ducats || 0;
      (g.warbands_games_warband_1_idTowarbands as any).gloryPoints = r.glory_points || 0;
    }
    if (g.warbands_games_warband_2_idTowarbands && g.warbands_games_warband_2_idTowarbands.rosters.length > 0) {
      const r = g.warbands_games_warband_2_idTowarbands.rosters[0];
      (g.warbands_games_warband_2_idTowarbands as any).modelCount = r.model_count || 0;
      (g.warbands_games_warband_2_idTowarbands as any).ducats = r.ducats || 0;
      (g.warbands_games_warband_2_idTowarbands as any).gloryPoints = r.glory_points || 0;
    }
    // Attach player1_id and player2_id to each game (for frontend convenience)
    (g as any).player1_id = (g as any).player1_id ?? g.warbands_games_warband_1_idTowarbands?.players?.id ?? null;
    (g as any).player2_id = (g as any).player2_id ?? g.warbands_games_warband_2_idTowarbands?.players?.id ?? null;
  }

  // Всі stories для цих ігор
  const stories = await prisma.stories.findMany({
    where: { warband_id: warbandId },
    select: { game_id: true, text: true },
  });

  // Уніфікуємо file_url для всіх ростерів у warband
  function mapRosters(rosters) {
    return (rosters || []).map(r => ({
      ...r,
      file_url: r.id ? `/api/roster?roster_id=${r.id}` : null
    }));
  }
  if (warband && warband.rosters) {
    warband.rosters = mapRosters(warband.rosters);
  }
  // Також у всіх іграх для обох warband_1 і warband_2 (якщо є ростери)
  for (const g of games) {
    if (g.warbands_games_warband_1_idTowarbands && g.warbands_games_warband_1_idTowarbands.rosters) {
      g.warbands_games_warband_1_idTowarbands.rosters = mapRosters(g.warbands_games_warband_1_idTowarbands.rosters);
    }
    if (g.warbands_games_warband_2_idTowarbands && g.warbands_games_warband_2_idTowarbands.rosters) {
      g.warbands_games_warband_2_idTowarbands.rosters = mapRosters(g.warbands_games_warband_2_idTowarbands.rosters);
    }
  }

  return NextResponse.json({ warband, games, stories });
}
