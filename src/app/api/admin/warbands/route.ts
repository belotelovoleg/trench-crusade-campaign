import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const auth = cookieStore.get('auth');
  if (!auth?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.players.findUnique({ where: { login: auth.value } });
  if (!user || !user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const warbands = await prisma.warbands.findMany({
    include: {
      players: { select: { id: true, login: true, name: true, avatar_url: true } },
      rosters: { select: { id: true, file_url: true, ducats: true } },
    },
    orderBy: { id: 'desc' },
  });

  // Приводимо до зручного формату
  const result = warbands.map((w: any) => ({
    id: w.id,
    name: w.name,
    status: w.status,
    player: w.players, // для зручності фронту залишаємо player, але це players
    catalogue_name: w.catalogue_name,
    rosters: w.rosters,
  }));

  return NextResponse.json({ warbands: result });
}
