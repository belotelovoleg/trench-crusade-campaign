import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken')?.value;
    
    if (!authToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Verify and decode JWT token
    const decoded = jwt.verify(authToken, JWT_SECRET) as any;
    const userId = decoded.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const user = await prisma.players.findUnique({
      where: { id: userId },
      select: {
        id: true,
        login: true,
        name: true,
        email: true,
        avatar_url: true,
        notes: true,
        is_super_admin: true,
        is_active: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken')?.value;
    
    if (!authToken) {
      return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
    }
    
    // Verify and decode JWT token
    const decoded = jwt.verify(authToken, JWT_SECRET) as any;
    const userId = decoded.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const user = await prisma.players.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 401 });
    }

    // Якщо multipart/form-data (є файл)
    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('avatar');
      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        // Read file as base64
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const fileName = `user_${user!.id}_${Date.now()}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${buffer.toString('base64')}`;
        await prisma.players.update({
          where: { id: user.id },
          data: {
            avatar: base64,
            avatar_url: fileName,
            udt: new Date(),
          },
        });
        return NextResponse.json({ success: true, avatar_url: fileName });
      }
      return NextResponse.json({ error: 'Файл не знайдено' }, { status: 400 });
    }

    // Якщо JSON (email, password, notes, avatar)
    const { email, password, newPassword, notes, avatar } = await request.json();
    const updateData: any = {};
    if (email && email !== user.email) {
      const exists = await prisma.players.findUnique({ where: { email } });
      if (exists && exists.id !== user.id) {
        return NextResponse.json({ error: 'Email вже використовується' }, { status: 400 });
      }
      updateData.email = email;
    }
    if (typeof notes === 'string' && notes !== user.notes) {
      updateData.notes = notes;
    }
    if (typeof avatar === 'string' && avatar.length > 100) {
      // Accept base64 avatar from cropper
      // Try to detect extension for avatar_url
      let ext = 'jpg';
      const match = avatar.match(/^data:image\/(\w+);base64,/);
      if (match) ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      const fileName = `user_${user!.id}_${Date.now()}.${ext}`;
      updateData.avatar = avatar;
      updateData.avatar_url = fileName;
    }
    if (newPassword) {
      if (!password) {
        return NextResponse.json({ error: 'Введіть старий пароль' }, { status: 400 });
      }
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Старий пароль невірний' }, { status: 400 });
      }
      updateData.password_hash = await bcrypt.hash(newPassword, 10);
    }
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Немає змін для збереження' }, { status: 400 });
    }
    updateData.udt = new Date();
    await prisma.players.update({ where: { id: user.id }, data: updateData });
    return NextResponse.json({ success: true, avatar_url: updateData.avatar_url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Помилка сервера' }, { status: 500 });
  }
}
