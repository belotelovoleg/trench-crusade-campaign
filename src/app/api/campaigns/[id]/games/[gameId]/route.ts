import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: fetch individual game data for viewing
export async function GET(req: NextRequest, { params }: { params: { id: string; gameId: string } }) {
  try {
    const campaignId = parseInt(params.id);
    const gameId = parseInt(params.gameId);
    
    if (!campaignId || !gameId) {
      return NextResponse.json({ error: 'Invalid campaign or game ID' }, { status: 400 });
    }

    // Require authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    // Check if user is a participant in this campaign
    const userCampaign = await prisma.players_campaigns.findFirst({
      where: {
        campaign_id: campaignId,
        player_id: user.userId
      }
    });

    if (!userCampaign) {
      return NextResponse.json({ error: 'Access denied. You must be a participant in this campaign.' }, { status: 403 });
    }    // Get the game with full warband and player data
    const game = await prisma.games.findUnique({
      where: { id: gameId },
      include: {
        warbands_games_warband_1_idTowarbands: {
          include: {
            players: {
              select: {
                id: true,
                login: true,
                name: true,
                avatar_url: true,
              },
            },
          },
        },
        warbands_games_warband_2_idTowarbands: {
          include: {
            players: {
              select: {
                id: true,
                login: true,
                name: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Verify that this game belongs to the specified campaign
    const warband1CampaignId = game.warbands_games_warband_1_idTowarbands?.campaign_id;
    const warband2CampaignId = game.warbands_games_warband_2_idTowarbands?.campaign_id;
    
    if (warband1CampaignId !== campaignId || warband2CampaignId !== campaignId) {
      return NextResponse.json({ error: 'Game does not belong to this campaign' }, { status: 403 });
    }

    return NextResponse.json({ game });
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
