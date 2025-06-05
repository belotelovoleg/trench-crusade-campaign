import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { promises as fs } from 'fs';
import path from 'path';

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const auth = cookieStore.get('auth');
    if (!auth?.value) {
      return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
    }
    const user = await prisma.players.findUnique({ where: { login: auth.value } });
    if (!user) {
      return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 401 });
    }
    // @ts-ignore
    const avatarUrl = (user as any).avatar_url;

    // Якщо multipart/form-data (є файл)
    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('avatar');
      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        // Видалити попередній аватар, якщо був
        if (avatarUrl) {
          const prevPath = path.join(process.cwd(), 'data', 'avatars', avatarUrl.replace(/^.*[\\/]/, ''));
          try { await fs.unlink(prevPath); } catch {}
        }
        // Зберегти новий файл
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const fileName = `user_${user!.id}_${Date.now()}.${ext}`;
        const filePath = path.join(process.cwd(), 'data', 'avatars', fileName);
        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, buffer);
        // @ts-ignore
        await prisma.$executeRawUnsafe(`UPDATE players SET avatar_url = ?, udt = ? WHERE id = ?`, fileName, new Date(), user!.id);
        return NextResponse.json({ success: true, avatar_url: fileName });
      }
      return NextResponse.json({ error: 'Файл не знайдено' }, { status: 400 });
    }

    // Якщо JSON (email, password, notes)
    const { email, password, newPassword, notes } = await request.json();
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
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Помилка сервера' }, { status: 500 });
  }
}
