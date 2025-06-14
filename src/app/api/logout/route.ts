import { NextResponse } from 'next/server';

export async function POST() {
  // Очищаємо JWT cookie
  return NextResponse.json({ success: true }, {
    status: 200,
    headers: {
      'Set-Cookie': 'authToken=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    },
  });
}
