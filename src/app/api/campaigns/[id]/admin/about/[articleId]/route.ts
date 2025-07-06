import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: get single article (admin only)
export async function GET(req: NextRequest, { params }: { params: { id: string; articleId: string } }) {
  try {
    const campaignId = parseInt(params.id);
    const articleId = parseInt(params.articleId);
    
    if (!campaignId || !articleId) {
      return NextResponse.json({ error: 'Невірний ID кампанії або статті' }, { status: 400 });
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
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get the article
    const article = await prisma.about_campaign.findFirst({
      where: { 
        id: articleId,
        campaign_id: campaignId,
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// PUT: update article
export async function PUT(req: NextRequest, { params }: { params: { id: string; articleId: string } }) {
  try {
    const campaignId = parseInt(params.id);
    const articleId = parseInt(params.articleId);
    
    if (!campaignId || !articleId) {
      return NextResponse.json({ error: 'Invalid campaign or article ID' }, { status: 400 });
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
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { title, content, excerpt, isPublished, showFullContent } = await req.json();

    // Update the article
    const article = await prisma.about_campaign.updateMany({
      where: { 
        id: articleId,
        campaign_id: campaignId,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(isPublished !== undefined && { isPublished }),
        ...(showFullContent !== undefined && { showFullContent }),
      },
    });

    if (article.count === 0) {
      return NextResponse.json({ error: 'Article not found or not updated' }, { status: 404 });
    }

    // Return updated article
    const updatedArticle = await prisma.about_campaign.findFirst({
      where: { 
        id: articleId,
        campaign_id: campaignId,
      },
    });

    return NextResponse.json({ article: updatedArticle });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// DELETE: delete article
export async function DELETE(req: NextRequest, { params }: { params: { id: string; articleId: string } }) {
  try {
    const campaignId = parseInt(params.id);
    const articleId = parseInt(params.articleId);
    
    if (!campaignId || !articleId) {
      return NextResponse.json({ error: 'Invalid campaign or article ID' }, { status: 400 });
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
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Delete the article
    const result = await prisma.about_campaign.deleteMany({
      where: { 
        id: articleId,
        campaign_id: campaignId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
