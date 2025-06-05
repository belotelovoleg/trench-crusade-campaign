import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('auth');
  if (!auth?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.players.findUnique({ where: { login: auth.value } });
  if (!user || !user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const body = await request.json();
  const { status } = body;
  if (!status) return NextResponse.json({ error: 'Missing status' }, { status: 400 });

  try {
    const updated = await prisma.warbands.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({ success: true, warband: updated });
  } catch (e) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
