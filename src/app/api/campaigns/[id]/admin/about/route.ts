import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: get all campaign articles (admin only)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Get all articles for this campaign
    const articles = await prisma.$queryRaw`
      SELECT * FROM "about_campaign" 
      WHERE "campaign_id" = ${campaignId} 
      ORDER BY "sortOrder" ASC, "createdAt" ASC
    ` as any[];

    return NextResponse.json({ articles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Невідома помилка' }, { status: 500 });
  }
}

// POST: create new article
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { title, content, excerpt, isPublished = true, showFullContent = false } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Заголовок обов\'язковий' }, { status: 400 });
    }

    // Get highest sort order for new article
    const maxOrderResult = await prisma.$queryRaw`
      SELECT COALESCE(MAX("sortOrder"), -1) + 1 as "nextOrder"
      FROM "about_campaign" 
      WHERE "campaign_id" = ${campaignId}
    ` as any[];
    
    const nextOrder = maxOrderResult[0]?.nextOrder || 0;

    // Create new article using raw SQL
    const result = await prisma.$queryRaw`
      INSERT INTO "about_campaign" ("campaign_id", "title", "content", "excerpt", "isPublished", "showFullContent", "sortOrder")
      VALUES (${campaignId}, ${title}, ${content || ''}, ${excerpt || ''}, ${isPublished}, ${showFullContent}, ${nextOrder})
      RETURNING *
    ` as any[];

    const article = result[0];

    return NextResponse.json({ article }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Невідома помилка' }, { status: 500 });
  }
}

// PATCH: update campaign about content (admin only)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { content } = await req.json();    // Update campaign description
    await prisma.campaigns.update({
      where: { id: campaignId },
      data: { description: content },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Невідома помилка' }, { status: 500 });
  }
}
