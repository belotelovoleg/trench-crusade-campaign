import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mark route as dynamic since it sets cookies
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: Request) {
  try {
    const { login, password } = await request.json();
    if (!login || !password) {
      return NextResponse.json({ success: false, error: 'Введіть логін і пароль' }, { status: 400 });
    }

    // Шукаємо користувача по логіну або email
    const user = await prisma.players.findFirst({
      where: {
        OR: [
          { login: login },
          { email: login }
        ]
      }
    });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Користувача не знайдено' }, { status: 401 });
    }

    // Перевіряємо пароль
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Користувача не знайдено' }, { status: 401 });
    }    // Додатковий захист: якщо користувач неактивний і не є супер адміном — заборонити логін
    if (user.is_active === false && user.is_super_admin !== true) {
      return NextResponse.json({ success: false, error: 'В доступі відмовлено: акаунт неактивний' }, { status: 403 });
    }

    // Оновлюємо ldt (last login date)
    await prisma.players.update({ where: { id: user.id }, data: { ldt: new Date() } });    // Create JWT token
    console.log("Creating JWT token for user:", user.id, "is_super_admin:", user.is_super_admin);
    const token = jwt.sign(
      { 
        userId: user.id, 
        login: user.login,
        name: user.name,
        email: user.email,
        is_super_admin: user.is_super_admin 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Встановлюємо httpOnly cookie з JWT токеном
    const response = NextResponse.json({ success: true, user: { id: user.id, login: user.login, email: user.email, name: user.name } });
    response.headers.set('Set-Cookie', `authToken=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`); // 30 днів
    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Помилка на сервері: ' + error.message }, { status: 500 });
  }
}
