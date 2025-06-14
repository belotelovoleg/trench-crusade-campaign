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

    // Delete all games where this warband participated (within this campaign)
    await prisma.games.deleteMany({
      where: {
        campaign_id: campaignId,
        OR: [
          { warband_1_id: warbandId },
          { warband_2_id: warbandId }
        ]
      }
    });

    // Delete all rosters for this warband
    await prisma.rosters.deleteMany({ where: { warband_id: warbandId } });

    // Delete all stories for this warband
    await prisma.stories.deleteMany({ where: { warband_id: warbandId } });

    // Delete the warband itself
    await prisma.warbands.delete({ where: { id: warbandId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting warband:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
