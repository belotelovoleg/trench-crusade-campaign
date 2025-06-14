import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/campaigns/[id]/players/[playerId]/warbands
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; playerId: string } }
) {
  // Require authentication to view player warbands
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaignId = parseInt(params.id);
    const playerId = parseInt(params.playerId);

    if (isNaN(campaignId) || isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid campaign ID or player ID' }, { status: 400 });
    }

    // Verify the requesting user has access to this campaign
    const userCampaign = await prisma.players_campaigns.findFirst({
      where: {
        campaign_id: campaignId,
        player_id: authResult.userId
      }
    });

    if (!userCampaign) {
      return NextResponse.json({ error: 'Not authorized for this campaign' }, { status: 403 });
    }

    // Get all warbands for this player in this campaign (like old API)
    const warbands = await prisma.warbands.findMany({
      where: {
        campaign_id: campaignId,
        player_id: playerId,
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        catalogue_name: true,
        rosters: {
          select: {
            id: true,
            model_count: true,
            ducats: true,
            glory_points: true,
            game_number: true,
          },
          orderBy: { game_number: 'desc' },
        },
      },
      orderBy: { id: 'asc' },
    });

    // Map file_url for all rosters (adapted for campaign structure)
    const warbandsWithMappedRosters = warbands.map(w => ({
      ...w,
      rosters: (w.rosters || []).map(r => ({
        ...r,
        file_url: r.id ? `/api/campaigns/${campaignId}/rosters/${r.id}` : null
      }))
    }));

    return NextResponse.json({ warbands: warbandsWithMappedRosters });
  } catch (error) {
    console.error('Error fetching player warbands:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
