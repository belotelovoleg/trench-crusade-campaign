import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

// POST /api/battle/plan
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('auth');
  if (!auth?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.players.findUnique({ where: { login: auth.value } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { warband_1_id, warband_2_id, warband_1_roster_id, warband_2_roster_id } = body;
  if (!warband_1_id || !warband_2_id) return NextResponse.json({ error: 'Missing warband ids' }, { status: 400 });

  // Перевіряємо, що warband_1 належить користувачу
  const myWarband = await prisma.warbands.findFirst({ where: { id: warband_1_id, player_id: user.id } });
  if (!myWarband) return NextResponse.json({ error: 'Not your warband' }, { status: 403 });

  // Перевіряємо, що warband_2 існує і активна
  const opponentWarband = await prisma.warbands.findFirst({ where: { id: warband_2_id, status: 'active' } });
  if (!opponentWarband) return NextResponse.json({ error: 'Opponent warband not found or not active' }, { status: 400 });

  // Перевіряємо, чи вже є запланована або активна гра для кожної варбанди
  const existingGame1 = await prisma.games.findFirst({
    where: {
      warband_1_id,
      status: { in: ['planned', 'active'] },
    },
  });
  const existingGame2 = await prisma.games.findFirst({
    where: {
      warband_2_id,
      status: { in: ['planned', 'active'] },
    },
  });
  if (existingGame1 || existingGame2) {
    return NextResponse.json({
      error: 'Одна з обраних варбанд вже має заплановану або активну битву. Завершіть поточну гру або скасуйте планування, перш ніж створювати нову.'
    }, { status: 400 });
  }

  // Визначаємо наступний номер гри для кожної варбанди (враховуємо і як warband_1, і як warband_2)
  async function getNextGameNumber(warbandId: number) {
    const games = await prisma.games.findMany({
      where: {
        OR: [
          { warband_1_id: warbandId },
          { warband_2_id: warbandId },
        ],
      },
      select: {
        warband_1_gameNumber: true,
        warband_2_gameNumber: true,
      },
    });
    let maxNumber = 0;
    for (const g of games) {
      if (g.warband_1_gameNumber && g.warband_1_gameNumber > maxNumber) maxNumber = g.warband_1_gameNumber;
      if (g.warband_2_gameNumber && g.warband_2_gameNumber > maxNumber) maxNumber = g.warband_2_gameNumber;
    }
    return maxNumber + 1;
  }

  const nextGameNumber1 = await getNextGameNumber(warband_1_id);
  const nextGameNumber2 = await getNextGameNumber(warband_2_id);

  // --- Перевірка на дубль номера гри для кожної варбанди ---
  const duplicateGame1 = await prisma.games.findFirst({
    where: { OR: [
      { warband_1_id: warband_1_id, warband_1_gameNumber: nextGameNumber1 },
      { warband_2_id: warband_1_id, warband_2_gameNumber: nextGameNumber1 },
    ] },
  });
  const duplicateGame2 = await prisma.games.findFirst({
    where: { OR: [
      { warband_1_id: warband_2_id, warband_1_gameNumber: nextGameNumber2 },
      { warband_2_id: warband_2_id, warband_2_gameNumber: nextGameNumber2 },
    ] },
  });
  if (duplicateGame1 || duplicateGame2) {
    return NextResponse.json({
      error: 'Для однієї з варбанд вже існує гра з таким номером. Неможливо створити дубль.'
    }, { status: 400 });
  }

  // Створюємо гру
  const game = await prisma.games.create({
    data: {
      warband_1_id,
      warband_2_id,
      warband_1_roster_id: warband_1_roster_id || null,
      warband_2_roster_id: warband_2_roster_id || null,
      warband_1_gameNumber: nextGameNumber1,
      warband_2_gameNumber: nextGameNumber2,
      status: 'planned',
      player1_id: myWarband.player_id, // <-- Заповнюємо player1_id
      player2_id: opponentWarband.player_id // <-- Заповнюємо player2_id
    },
  });
  return NextResponse.json({ success: true, game });
}

// DELETE: скасування (видалення) запрошення на гру
export async function DELETE(req: Request) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('auth');
  if (!auth?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.players.findUnique({ where: { login: auth.value } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const id = Number(url.searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Перевіряємо, що гра належить користувачу (warband_1_id або warband_2_id)
  const game = await prisma.games.findUnique({ where: { id } });
  if (!game || !game.warband_1_id || !game.warband_2_id) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  const myWarband = await prisma.warbands.findFirst({ where: { id: { in: [game.warband_1_id, game.warband_2_id] }, player_id: user.id } });
  if (!myWarband) return NextResponse.json({ error: 'Not your game' }, { status: 403 });

  // Видаляємо гру
  await prisma.games.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
