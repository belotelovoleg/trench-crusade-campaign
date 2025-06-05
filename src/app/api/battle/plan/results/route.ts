import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

// PATCH /api/battle/plan/results
export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('auth');
  if (!auth?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.players.findUnique({ where: { login: auth.value } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { game_id, vp_1, vp_2, gp_1, gp_2, action,
    player1_calledReinforcements,
    player2_calledReinforcements,
    player1_injuries,
    player2_injuries,
    player1_skillAdvancements,
    player2_skillAdvancements,
    player1_explorationDice,
    player2_explorationDice
  } = body;
  if (!game_id) return NextResponse.json({ error: 'Missing game_id' }, { status: 400 });

  // Дозволяємо тільки учасникам гри подавати результати
  const game = await prisma.games.findUnique({ where: { id: game_id }, select: {
    id: true,
    warband_1_id: true,
    warband_2_id: true,
    player1_isApprovedResult: true,
    player2_isApprovedResult: true,
    vp_1: true,
    vp_2: true,
    gp_1: true,
    gp_2: true,
    status: true,
  } });
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  const warband = await prisma.warbands.findFirst({ where: { player_id: user.id, id: { in: [game.warband_1_id, game.warband_2_id] } } });
  if (!warband) return NextResponse.json({ error: 'Not your game' }, { status: 403 });

  // Визначаємо, хто подає результат
  let update: any = {};
  if (warband.id === game.warband_1_id) {
    update.player1_isApprovedResult = true;
  } else if (warband.id === game.warband_2_id) {
    update.player2_isApprovedResult = true;
  }

  // Якщо діємо як approve/reject (confirmation step)
  if (action === 'approve') {
    // Підтвердження опонентом
    if (warband.id === game.warband_1_id) {
      update.player1_isApprovedResult = true;
    } else if (warband.id === game.warband_2_id) {
      update.player2_isApprovedResult = true;
    }
    // Якщо обидва підтвердили — статус finished
    if ((game.player1_isApprovedResult || update.player1_isApprovedResult) && (game.player2_isApprovedResult || update.player2_isApprovedResult)) {
      update.status = 'finished';
    }
  } else if (action === 'reject') {
    // Відхилення — скидаємо результати, статус active
    update = {
      vp_1: 0,
      vp_2: 0,
      gp_1: 0,
      gp_2: 0,
      player1_isApprovedResult: false,
      player2_isApprovedResult: false,
      status: 'active',
    };
  } else {
    // Подача результату — статус pending_approval
    update.vp_1 = typeof vp_1 === 'number' ? vp_1 : 0;
    update.vp_2 = typeof vp_2 === 'number' ? vp_2 : 0;
    update.gp_1 = typeof gp_1 === 'number' ? gp_1 : 0;
    update.gp_2 = typeof gp_2 === 'number' ? gp_2 : 0;
    update.status = 'pending_approval';
    // Нові поля
    function normalizeArray(arr: any) {
      if (!Array.isArray(arr)) return [];
      return arr
        .filter((x) => x && typeof x.name === 'string' && x.name.trim() && x.roll !== undefined && x.roll !== null && String(x.roll).trim() !== '')
        .map((x) => ({ name: x.name.trim(), roll: Number(x.roll) }));
    }
    if (typeof player1_calledReinforcements === 'boolean') update.player1_calledReinforcements = player1_calledReinforcements;
    if (typeof player2_calledReinforcements === 'boolean') update.player2_calledReinforcements = player2_calledReinforcements;
    if (player1_injuries !== undefined) update.player1_injuries = normalizeArray(player1_injuries);
    if (player2_injuries !== undefined) update.player2_injuries = normalizeArray(player2_injuries);
    if (player1_skillAdvancements !== undefined) update.player1_skillAdvancements = normalizeArray(player1_skillAdvancements);
    if (player2_skillAdvancements !== undefined) update.player2_skillAdvancements = normalizeArray(player2_skillAdvancements);
    if (typeof player1_explorationDice === 'number') update.player1_explorationDice = player1_explorationDice;
    if (typeof player2_explorationDice === 'number') update.player2_explorationDice = player2_explorationDice;
  }

  const updated = await prisma.games.update({
    where: { id: game_id },
    data: update,
  });

  // Якщо гра завершена (обидва підтвердили), оновлюємо статус варбанд
  if (update.status === 'finished') {
    await prisma.warbands.updateMany({
      where: {
        id: { in: [game.warband_1_id, game.warband_2_id] }
      },
      data: { status: 'needs_update' }
    });
  }

  return NextResponse.json({ success: true, game: updated });
}
