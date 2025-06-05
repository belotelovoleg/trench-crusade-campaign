import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { unlink } from 'fs/promises';
import path from 'path';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const auth = cookieStore.get('auth');
  if (!auth?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.players.findUnique({ where: { login: auth.value } });
  if (!user || !user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const warbandId = Number(id);
  // Видаляємо всі ігри, де ця варбанда брала участь
  await prisma.games.deleteMany({
    where: {
      OR: [
        { warband_1_id: warbandId },
        { warband_2_id: warbandId }
      ]
    }
  });
  // Знаходимо всі ростери цієї варбанди
  const rosters = await prisma.rosters.findMany({ where: { warband_id: warbandId } });
  // Видаляємо файли
  for (const r of rosters) {
    if (r.file_url && r.file_url.startsWith('/rosters/')) {
      const filePath = path.join(process.cwd(), 'public', r.file_url);
      try { await unlink(filePath); } catch {}
    }
  }
  // Видаляємо ростери
  await prisma.rosters.deleteMany({ where: { warband_id: warbandId } });
  // Видаляємо варбанду
  await prisma.warbands.delete({ where: { id: warbandId } });
  return NextResponse.json({ ok: true });
}
