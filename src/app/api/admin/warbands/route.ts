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
      rosters: { select: { id: true, file_url: true, ducats: true, game_number: true } },
    },
    orderBy: { id: 'desc' },
  });

  // Уніфікуємо file_url для всіх ростерів у кожній варбанді
  const result = warbands.map((w: any) => ({
    ...w,
    player: w.players, // <-- використовуємо players
    rosters: (w.rosters || []).map((r: any) => ({
      ...r,
      file_url: r.id ? `/api/roster?roster_id=${r.id}` : null,
    })),
  }));

  return NextResponse.json({ warbands: result });
}
