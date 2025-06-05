import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { login, password } = await request.json();
    if (!login || !password) {
      return NextResponse.json({ success: false, error: 'Введіть логін і пароль' }, { status: 400 });
    }

    // Знаходимо користувача по логіну
    const user = await prisma.players.findUnique({ where: { login } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Користувача не знайдено' }, { status: 401 });
    }

    // Перевіряємо пароль
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Користувача не знайдено' }, { status: 401 });
    }

    // Додатковий захист: якщо користувач неактивний і не є адміном — заборонити логін
    if (user.is_active === false && user.is_admin !== true) {
      return NextResponse.json({ success: false, error: 'В доступі відмовлено: акаунт неактивний' }, { status: 403 });
    }

    // Оновлюємо ldt (last login date)
    await prisma.players.update({ where: { id: user.id }, data: { ldt: new Date() } });

    // Встановлюємо httpOnly cookie з login
    const response = NextResponse.json({ success: true, user: { id: user.id, login: user.login, email: user.email, name: user.name } });
    response.headers.set('Set-Cookie', `auth=${user.login}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`); // 7 днів
    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Помилка на сервері: ' + error.message }, { status: 500 });
  }
}
