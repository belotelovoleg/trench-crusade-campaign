import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const auth = cookieStore.get('auth');
  if (!auth?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.players.findUnique({ where: { login: auth.value } });
  if (!user || !user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const warbandId = Number(id);
  await prisma.warbands.update({ where: { id: warbandId }, data: { status: 'deleted' } });
  return NextResponse.json({ ok: true });
}
