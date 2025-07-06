// API для отримання about_campaign по ID кампанії
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface Article {
  id: number;
  title: string;
  excerpt: string | null;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
  showFullContent: boolean | null;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Require authentication to view campaign about
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  try {
    const campaignId = parseInt(params.id);
    
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    // Check if user is participant of this campaign
    const playerCampaign = await prisma.players_campaigns.findUnique({
      where: {
        player_id_campaign_id: {
          player_id: authResult.userId,
          campaign_id: campaignId,
        },
      },
    });

    if (!playerCampaign) {
      return NextResponse.json({ error: 'Потрібен доступ до кампанії' }, { status: 403 });
    }

    // Get published articles for this campaign in sort order
    const result = await prisma.$queryRaw`
      SELECT id, title, excerpt, content, "createdAt", "updatedAt", "showFullContent"
      FROM about_campaign 
      WHERE campaign_id = ${campaignId} AND "isPublished" = true
      ORDER BY "sortOrder" ASC, "createdAt" ASC
    `;

    const articles = result as Article[];

    const response = NextResponse.json({ articles });
    
    // Disable caching to get fresh content immediately
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching campaign about:', error);
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaignId = parseInt(params.id);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Невірний ID кампанії' }, { status: 400 });
    }

    const userCampaign = await prisma.players_campaigns.findFirst({
      where: {
        campaign_id: campaignId,
        player_id: authResult.userId,
      },
    });

    if (!userCampaign) {
      return NextResponse.json({ error: 'Не авторизований для цієї кампанії' }, { status: 403 });
    }

    const body = await request.json();
    const content = body.content;

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Невірний формат контенту' }, { status: 400 });
    }    // First check if about_campaign entry exists for this campaign
    const existingAbout = await prisma.about_campaign.findFirst({
      where: { campaign_id: campaignId }
    });

    if (existingAbout) {
      // Update existing record
      await prisma.about_campaign.update({
        where: { id: existingAbout.id },
        data: { content }
      });
    } else {
      // Create new record
      await prisma.about_campaign.create({
        data: { campaign_id: campaignId, content }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating campaign about:', error);
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 });
  }
}
