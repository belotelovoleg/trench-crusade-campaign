import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST: Join a campaign as a participant
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = parseInt(params.id);
    if (!campaignId) {
      return NextResponse.json({ error: 'Недійсний ID кампанії' }, { status: 400 });
    }

    // Require authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    // Check if campaign exists and is active
    const campaign = await prisma.campaigns.findUnique({
      where: { id: campaignId },
    });    if (!campaign) {
      return NextResponse.json({ error: 'Кампанію не знайдено' }, { status: 404 });
    }    if (!campaign.is_active) {
      return NextResponse.json({ error: 'Кампанія не активна' }, { status: 400 });
    }

    // Check if user is already in ANY campaign (only one campaign per player allowed)
    const existingParticipation = await prisma.players_campaigns.findFirst({
      where: {
        player_id: user.userId,
      },
      include: {
        campaigns: {
          select: {
            id: true,
            name: true,
          },
        },      },
    });      if (existingParticipation) {
      if (existingParticipation.campaign_id === campaignId) {
        return NextResponse.json({ error: 'Ви вже є учасником цієї кампанії' }, { status: 400 });
      } else {
        return NextResponse.json({ 
          error: `Ви вже берете участь у кампанії "${existingParticipation.campaigns.name}". Ви можете брати участь лише в одній кампанії одночасно.`,
          currentCampaign: existingParticipation.campaigns
        }, { status: 400 });
      }
    }

    // Add user to campaign as regular participant (not admin)
    const playerCampaign = await prisma.players_campaigns.create({
      data: {
        player_id: user.userId,
        campaign_id: campaignId,
        is_admin: false,
      },
    });    return NextResponse.json({ 
      success: true, 
      message: 'Ви успішно приєдналися до кампанії',
      playerCampaign 
    });  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Невідома помилка' }, { status: 500 });
  }
}

// DELETE: Leave a campaign
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = parseInt(params.id);
    if (!campaignId) {
      return NextResponse.json({ error: 'Недійсний ID кампанії' }, { status: 400 });
    }

    // Require authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    // Check if user is in the campaign
    const playerCampaign = await prisma.players_campaigns.findUnique({
      where: {
        player_id_campaign_id: {
          player_id: user.userId,
          campaign_id: campaignId,
        },
      },
    });    if (!playerCampaign) {
      return NextResponse.json({ error: 'Ви не є учасником цієї кампанії' }, { status: 400 });
    }

    // Don't allow leaving if user has active warbands in the campaign
    const activeWarbands = await prisma.warbands.count({
      where: {
        player_id: user.userId,
        campaign_id: campaignId,
        status: {
          not: 'deleted',
        },
      },
    });    if (activeWarbands > 0) {
      return NextResponse.json({ 
        error: 'Неможливо покинути кампанію, доки у вас є активні загони. Будь ласка, видаліть або деактивуйте свої загони спочатку.' 
      }, { status: 400 });
    }

    // Remove user from campaign
    await prisma.players_campaigns.delete({
      where: {
        player_id_campaign_id: {
          player_id: user.userId,
          campaign_id: campaignId,
        },
      },
    });    return NextResponse.json({ 
      success: true, 
      message: 'Ви успішно покинули кампанію' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Невідома помилка' }, { status: 500 });
  }
}
