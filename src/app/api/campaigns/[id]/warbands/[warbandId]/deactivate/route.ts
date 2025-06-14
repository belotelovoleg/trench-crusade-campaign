import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string; warbandId: string } }) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaignId = parseInt(params.id);
    const warbandId = parseInt(params.warbandId);
    
    if (isNaN(campaignId) || isNaN(warbandId)) {
      return NextResponse.json({ error: 'Invalid campaign or warband ID' }, { status: 400 });
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

    // Verify the warband belongs to this campaign
    const warband = await prisma.warbands.findFirst({
      where: {
        id: warbandId,
        campaign_id: campaignId,
      },
    });

    if (!warband) {
      return NextResponse.json({ error: 'Warband not found in this campaign' }, { status: 404 });
    }

    // Deactivate the warband by setting status to deleted
    await prisma.warbands.update({ 
      where: { id: warbandId }, 
      data: { status: 'deleted' } 
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deactivating warband:', error);
    return NextResponse.json({ error: 'Deactivation failed' }, { status: 500 });
  }
}
