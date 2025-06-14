import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PATCH(
  request: Request, 
  { params }: { params: { id: string; warbandId: string } }
) {
  // Require authentication for admin actions
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaignId = parseInt(params.id);
    const warbandId = parseInt(params.warbandId);

    if (isNaN(campaignId) || isNaN(warbandId)) {
      return NextResponse.json({ error: 'Invalid campaign ID or warband ID' }, { status: 400 });
    }

    // Check if user is admin for this campaign
    const playerCampaign = await prisma.players_campaigns.findFirst({
      where: {
        campaign_id: campaignId,
        player_id: authResult.userId,
        is_admin: true
      }
    });

    if (!playerCampaign) {
      return NextResponse.json({ error: 'Admin access required for this campaign' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;
    if (!status) return NextResponse.json({ error: 'Missing status' }, { status: 400 });

    // Verify warband belongs to this campaign and update its status
    const updated = await prisma.warbands.updateMany({
      where: { 
        id: warbandId,
        campaign_id: campaignId
      },
      data: { status },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Warband not found in this campaign' }, { status: 404 });
    }

    // Fetch the updated warband to return
    const warband = await prisma.warbands.findFirst({
      where: {
        id: warbandId,
        campaign_id: campaignId
      }
    });

    return NextResponse.json({ success: true, warband });
  } catch (error) {
    console.error('Error updating warband status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
