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
    const existingLogin = await prisma.players.findUnique({ where: { login } });
    if (existingLogin) {
      return NextResponse.json({
        success: false,
        errors: [{ field: 'login', message: 'Користувач з таким логіном вже існує' }],
      }, { status: 400 });
    }
    
    // Перевірка на існуючий email
    const existingEmail = await prisma.players.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({
        success: false,
        errors: [{ field: 'email', message: 'Користувач з такою email адресою вже існує' }],
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
    });  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle specific database errors in a user-friendly way
    if (error.code === 'P2002') {
      // This is a Prisma unique constraint violation
      const target = error.meta?.target?.[0] || 'field';
      let fieldName = 'server';
      let message = 'Помилка дублікату даних';
      
      if (target === 'login') {
        fieldName = 'login';
        message = 'Користувач з таким логіном вже існує';
      } else if (target === 'email') {
        fieldName = 'email';
        message = 'Користувач з такою email адресою вже існує';
      }
      
      return NextResponse.json({
        success: false,
        errors: [{ field: fieldName, message }],
      }, { status: 400 });
    }
    
    // Generic error handling
    return NextResponse.json({
      success: false,
      errors: [{ field: 'server', message: 'Виникла помилка при реєстрації. Спробуйте ще раз.' }],
    }, { status: 500 });
  }
}
