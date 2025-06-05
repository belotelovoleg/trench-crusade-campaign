import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

// GET: список всіх гравців
export async function GET() {
  const cookieStore = await cookies();
  const auth = cookieStore.get('auth');
  if (!auth?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.players.findUnique({ where: { login: auth.value } });
  if (!user || !user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const players = await prisma.players.findMany({
    select: {
      id: true,
      login: true,
      name: true,
      email: true,
      avatar_url: true,
      notes: true,
      is_admin: true,
      is_active: true,
      idt: true,
      udt: true,
      ldt: true,
    },
    orderBy: { id: 'asc' },
  });
  return NextResponse.json({ players });
}

// PATCH: оновлення інфи (name, email, notes, is_admin, is_active)
export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('auth');
  if (!auth?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = await prisma.players.findUnique({ where: { login: auth.value } });
  if (!admin || !admin.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // avatar_url не дозволено оновлювати напряму через PATCH
  const { id, name, email, notes, is_admin, is_active } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Формуємо updateData динамічно, щоб уникнути проблем з undefined
  const updateData: any = {};
  if (typeof name !== 'undefined') updateData.name = name;
  if (typeof email !== 'undefined') updateData.email = email;
  if (typeof notes !== 'undefined') updateData.notes = notes;
  if (typeof is_admin !== 'undefined') updateData.is_admin = is_admin;
  if (typeof is_active !== 'undefined') updateData.is_active = is_active;

  const updated = await prisma.players.update({
    where: { id },
    data: updateData,
  });
  return NextResponse.json({ player: updated });
}

// POST: зміна пароля
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('auth');
  if (!auth?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = await prisma.players.findUnique({ where: { login: auth.value } });
  if (!admin || !admin.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, password } = await req.json();
  if (!id || !password || password.length < 4) return NextResponse.json({ error: 'Missing id or password' }, { status: 400 });
  const password_hash = await bcrypt.hash(password, 10);
  await prisma.players.update({ where: { id }, data: { password_hash } });
  return NextResponse.json({ ok: true });
}

// DELETE: видалення гравця
export async function DELETE(req: Request) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('auth');
  if (!auth?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = await prisma.players.findUnique({ where: { login: auth.value } });
  if (!admin || !admin.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Не дозволяємо видаляти себе
  if (admin.id === id) return NextResponse.json({ error: 'Не можна видалити себе' }, { status: 400 });

  await prisma.players.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
