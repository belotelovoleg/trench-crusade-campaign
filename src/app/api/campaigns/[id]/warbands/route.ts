import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Get all warbands in a campaign for the table view (campaign participants only)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = parseInt(params.id);
    if (!campaignId) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }    // Require authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    // Check if campaign exists
    const campaign = await prisma.campaigns.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }    // Check if user is a participant in this campaign
    const userCampaign = await prisma.players_campaigns.findFirst({
      where: {
        campaign_id: campaignId,
        player_id: user.userId
      }
    });

    if (!userCampaign) {
      return NextResponse.json({ error: 'Access denied. You must be a participant in this campaign to view warbands.' }, { status: 403 });
    }    // Get all warbands in this campaign with stats
    const warbands = await prisma.warbands.findMany({
      where: { 
        campaign_id: campaignId,
        status: {
          not: 'deleted'
        }
      },
      include: {
        players: {
          select: {
            id: true,
            login: true,
            name: true,
            avatar_url: true,
          },
        },
        rosters: {
          select: {
            id: true,
            ducats: true,
            model_count: true,
            glory_points: true,
            game_number: true,
            file_url: true,
          },
          orderBy: { game_number: 'desc' },
        },
      },
      orderBy: { id: 'asc' },
    });

    // Calculate stats for each warband
    const warbandsWithStats = await Promise.all(
      warbands.map(async (warband) => {
        // Get all games for this warband
        const games = await prisma.games.findMany({
          where: {
            OR: [
              { warband_1_id: warband.id },
              { warband_2_id: warband.id },
            ],
            status: 'finished',
          },
        });

        // Calculate total victory points
        let total_vp = 0;
        let total_games = games.length;
        let wins = 0;
        let losses = 0;
        let draws = 0;

        games.forEach((game) => {
          const isWarband1 = game.warband_1_id === warband.id;
          const myVP = isWarband1 ? (game.vp_1 || 0) : (game.vp_2 || 0);
          const opponentVP = isWarband1 ? (game.vp_2 || 0) : (game.vp_1 || 0);

          total_vp += myVP;

          if (myVP > opponentVP) {
            wins++;
          } else if (myVP < opponentVP) {
            losses++;
          } else {
            draws++;
          }
        });        return {
          id: warband.id,
          name: warband.name,
          status: warband.status,
          catalogue_name: warband.catalogue_name,
          player: warband.players,
          rosters: (warband.rosters || []).map((r: any) => ({
            ...r,
            file_url: r.id ? `/api/roster?roster_id=${r.id}` : null,
          })),
          latest_roster: warband.rosters[0] || null,
          total_vp,
          total_games,
          wins,
          losses,
          draws,
          win_rate: total_games > 0 ? Math.round((wins / total_games) * 100) : 0,
        };
      })
    );    return NextResponse.json({ warbands: warbandsWithStats });  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
