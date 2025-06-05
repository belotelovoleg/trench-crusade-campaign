import { NextResponse } from 'next/server';

export async function POST() {
  // Очищаємо cookie (наприклад, auth або session)
  return NextResponse.json({ success: true }, {
    status: 200,
    headers: {
      'Set-Cookie': 'auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    },
  });
}
