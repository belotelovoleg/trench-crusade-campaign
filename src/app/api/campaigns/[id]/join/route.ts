import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST: Join a campaign as a participant
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = parseInt(params.id);
    if (!campaignId) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
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
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }    if (!campaign.is_active) {
      return NextResponse.json({ error: 'Campaign is not active' }, { status: 400 });
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
    });

    if (existingParticipation) {
      if (existingParticipation.campaign_id === campaignId) {
        return NextResponse.json({ error: 'You are already a participant in this campaign' }, { status: 400 });
      } else {
        return NextResponse.json({ 
          error: `You are already participating in campaign "${existingParticipation.campaigns.name}". You can only participate in one campaign at a time.`,
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
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully joined the campaign',
      playerCampaign 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// DELETE: Leave a campaign
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = parseInt(params.id);
    if (!campaignId) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
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
    });

    if (!playerCampaign) {
      return NextResponse.json({ error: 'You are not a participant in this campaign' }, { status: 400 });
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
    });

    if (activeWarbands > 0) {
      return NextResponse.json({ 
        error: 'Cannot leave campaign while you have active warbands. Please delete or deactivate your warbands first.' 
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
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully left the campaign' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
