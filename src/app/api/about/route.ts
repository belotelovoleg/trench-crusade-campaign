// API для отримання about_campaign (тільки контент)
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const about = await prisma.about_campaign.findFirst();
  return NextResponse.json({ content: about?.content || '' });
}
