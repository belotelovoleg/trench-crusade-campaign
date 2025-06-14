import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { unlink } from 'fs/promises';
import path from 'path';

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

    // Delete all games where this warband participated
    await prisma.games.deleteMany({
      where: {
        OR: [
          { warband_1_id: warbandId },
          { warband_2_id: warbandId }
        ]
      }
    });

    // Find all rosters of this warband
    const rosters = await prisma.rosters.findMany({ where: { warband_id: warbandId } });

    // Delete roster files
    for (const r of rosters) {
      if (r.file_url && r.file_url.startsWith('/rosters/')) {
        const filePath = path.join(process.cwd(), 'public', r.file_url);
        try { 
          await unlink(filePath); 
        } catch {}
      }
    }

    // Delete rosters
    await prisma.rosters.deleteMany({ where: { warband_id: warbandId } });

    // Delete stories
    await prisma.stories.deleteMany({ where: { warband_id: warbandId } });

    // Delete the warband
    await prisma.warbands.delete({ where: { id: warbandId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting warband:', error);
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
  }
}
