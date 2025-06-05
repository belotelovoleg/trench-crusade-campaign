import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

// GET: отримати about_campaign
export async function GET() {
  const about = await prisma.about_campaign.findUnique({ where: { id: 1 } });
  return NextResponse.json({ content: about?.content ?? '' });
}

// PATCH: оновити about_campaign (тільки для адміна)
export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('auth');
  if (!auth?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.players.findUnique({ where: { login: auth.value } });
  if (!user || !user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { content } = await req.json();
  await prisma.about_campaign.upsert({
    where: { id: 1 },
    update: { content },
    create: { id: 1, content },
  });
  return NextResponse.json({ ok: true });
}
