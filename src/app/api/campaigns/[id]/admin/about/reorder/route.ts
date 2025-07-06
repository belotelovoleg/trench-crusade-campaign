import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT: reorder articles
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = parseInt(params.id);
    if (!campaignId) {
      return NextResponse.json({ error: 'Невірний ID кампанії' }, { status: 400 });
    }

    // Require authentication and campaign admin rights
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    // Check if user is admin of this campaign
    const playerCampaign = await prisma.players_campaigns.findUnique({
      where: {
        player_id_campaign_id: {
          player_id: user.userId,
          campaign_id: campaignId,
        },
      },
    });

    if (!playerCampaign?.is_admin) {
      return NextResponse.json({ error: 'Потрібні права адміністратора' }, { status: 403 });
    }

    const { articleIds } = await req.json();
    if (!Array.isArray(articleIds)) {
      return NextResponse.json({ error: 'Невірний формат даних' }, { status: 400 });
    }

    // Use raw SQL to update sortOrder for each article
    for (let i = 0; i < articleIds.length; i++) {
      await prisma.$executeRaw`
        UPDATE "about_campaign" 
        SET "sortOrder" = ${i} 
        WHERE "id" = ${articleIds[i]} AND "campaign_id" = ${campaignId}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reorder error:', error);
    return NextResponse.json({ error: error.message || 'Невідома помилка' }, { status: 500 });
  }
}
