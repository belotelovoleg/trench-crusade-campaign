import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: { id: string; rosterId: string } }) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaignId = parseInt(params.id);
    const rosterId = parseInt(params.rosterId);
    
    if (isNaN(campaignId) || isNaN(rosterId)) {
      return NextResponse.json({ error: 'Invalid campaign or roster ID' }, { status: 400 });
    }

    // Verify the requesting user has admin access to this campaign
    const userCampaign = await prisma.players_campaigns.findFirst({
      where: {
        campaign_id: campaignId,
        player_id: authResult.userId,
      },
    });

    if (!userCampaign || !userCampaign.is_admin) {
      return NextResponse.json({ error: 'Admin privileges required for this action' }, { status: 403 });
    }

    // Get the roster and verify it belongs to a warband in this campaign
    const roster = await prisma.rosters.findFirst({
      where: { id: rosterId },
      include: {
        warbands: {
          select: { campaign_id: true }
        }
      }
    });

    if (!roster || roster.warbands.campaign_id !== campaignId) {
      return NextResponse.json({ error: 'Roster not found in this campaign' }, { status: 404 });
    }

    // Delete the roster
    await prisma.rosters.delete({
      where: { id: rosterId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting roster:', error);
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
  }
}
