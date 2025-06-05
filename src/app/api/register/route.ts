import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body = await req.json();
  const { login, password, name, email } = body;

  const errors: { field: string; message: string }[] = [];

  // 🔍 Валідація полів
  if (!login || login.trim() === '') {
    errors.push({ field: 'login', message: 'Логін обовʼязковий' });
  }

  if (!password || password.length < 4) {
    errors.push({ field: 'password', message: 'Пароль має бути щонайменше 4 символи' });
  }

  if (!email || !email.includes('@')) {
    errors.push({ field: 'email', message: 'Некоректна email адреса' });
  }

  if (errors.length > 0) {
    return NextResponse.json({ success: false, errors }, { status: 400 });
  }

  try {
    // 🚫 Перевірка на існуючого користувача
    const existing = await prisma.players.findUnique({ where: { login } });
    if (existing) {
      return NextResponse.json({
        success: false,
        errors: [{ field: 'login', message: 'Користувач з таким логіном вже існує' }],
      }, { status: 400 });
    }

    // 🔐 Хешування паролю
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Створення гравця
    const player = await prisma.players.create({
      data: {
        login,
        password_hash: hashedPassword,
        name,
        email,
        idt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      player: {
        id: player.id,
        login: player.login,
        email: player.email,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      errors: [{ field: 'server', message: 'Помилка на сервері: ' + error.message }],
    }, { status: 500 });
  }
}
