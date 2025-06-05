import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  // Зчитуємо cookie (наприклад, auth)
  const cookieStore = await cookies();
  const auth = cookieStore.get ? cookieStore.get('auth') : null;
  if (!auth?.value) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  // Знаходимо користувача
  const user = await prisma.players.findUnique({
    where: { login: auth.value },
    select: { id: true, login: true, name: true, email: true, is_admin: true, avatar_url: true },
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  // Всі варбанди користувача з file_url останнього ростера (якщо є)
  const warbands = await prisma.warbands.findMany({
    where: { player_id: user.id },
    select: {
      id: true, // Додаємо id
      name: true,
      status: true,
      rosters: {
        orderBy: { uploaded_at: 'desc' },
        take: 1,
        select: { file_url: true },
      },
    },
  });
  // flat file_url
  const warbandsWithFile = warbands.map(w => ({
    id: w.id, // Додаємо id у відповідь
    name: w.name,
    status: w.status,
    file_url: w.rosters[0]?.id ? `/api/roster?roster_id=${w.rosters[0].id}` : null,
  }));
  const warbandCount = warbands.length;

  return NextResponse.json({
    user: user && {
      id: user.id,
      login: user.login,
      name: user.name,
      email: user.email,
      is_admin: user.is_admin,
      avatar: user.avatar_url ? `/${user.avatar_url}` : null,
      hasWarband: warbandCount > 0,
      warbandCount,
      warbands: warbandsWithFile,
    },
  });
}
