// API для отримання about_campaign (тільки контент)
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const about = await prisma.about_campaign.findFirst();
  
  const response = NextResponse.json({ content: about?.content || '' });
  
  // Disable caching to get fresh content immediately
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}
