import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(
  req: Request, 
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

    // Verify warband belongs to this campaign
    const warband = await prisma.warbands.findFirst({
      where: {
        id: warbandId,
        campaign_id: campaignId
      }
    });

    if (!warband) {
      return NextResponse.json({ error: 'Warband not found in this campaign' }, { status: 404 });
    }

    // Deactivate the warband
    await prisma.warbands.update({ 
      where: { id: warbandId }, 
      data: { status: 'deleted' } 
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deactivating warband:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
