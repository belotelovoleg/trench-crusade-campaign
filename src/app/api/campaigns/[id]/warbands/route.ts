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
    }

    // Require authentication
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
    }

    // Check if user is a participant in this campaign
    const userCampaign = await prisma.players_campaigns.findFirst({
      where: {
        campaign_id: campaignId,
        player_id: user.userId
      }
    });

    if (!userCampaign) {
      return NextResponse.json({ error: 'Access denied. You must be a participant in this campaign to view warbands.' }, { status: 403 });
    }

    // Get all warbands in this campaign with stats
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
      warbands.map(async (warband) => {        // Get all games for this warband
        const games = await prisma.games.findMany({
          where: {
            OR: [
              { warband_1_id: warband.id },
              { warband_2_id: warband.id },
            ],
          }
        });

        // Get warband names for all games
        const warbandIds = new Set<number>();
        games.forEach(game => {
          if (game.warband_1_id !== warband.id) warbandIds.add(game.warband_1_id);
          if (game.warband_2_id !== warband.id) warbandIds.add(game.warband_2_id);
        });

        const opponentWarbands = await prisma.warbands.findMany({
          where: {
            id: {
              in: Array.from(warbandIds)
            }
          },
          select: {
            id: true,
            name: true
          }
        });

        const warbandNamesMap = Object.fromEntries(
          opponentWarbands.map(w => [w.id, w.name])
        );

        // Calculate total victory points
        let total_vp = 0;
        let total_games = games.length;
        let wins = 0;
        let losses = 0;
        let draws = 0;

        // Process games and create game cells for the table
        const gameCells = games.map(game => {
          const isWarband1 = game.warband_1_id === warband.id;
          const myVP = isWarband1 ? (game.vp_1 || 0) : (game.vp_2 || 0);
          const opponentVP = isWarband1 ? (game.vp_2 || 0) : (game.vp_1 || 0);
          const myGP = isWarband1 ? (game.gp_1 || 0) : (game.gp_2 || 0);
          const opponentGP = isWarband1 ? (game.gp_2 || 0) : (game.gp_1 || 0);          // Get opponent name from map
          const opponentWarbandId = isWarband1 ? game.warband_2_id : game.warband_1_id;
          const opponentName = warbandNamesMap[opponentWarbandId] || 'Unknown Opponent';

          // Count stats only for finished games
          if (game.status === 'finished') {
            total_vp += myVP;

            if (myVP > opponentVP) {
              wins++;
            } else if (myVP < opponentVP) {
              losses++;
            } else {
              draws++;
            }
          }          return {
            id: game.id,
            number: isWarband1 ? (game.warband_1_gameNumber || 0) : (game.warband_2_gameNumber || 0),
            status: game.status,
            opponent: opponentName,
            vp: myVP,
            gp: myGP,
            opponent_vp: opponentVP,
            opponent_gp: opponentGP,
            opponent_id: opponentWarbandId
          };
        });        return {
          id: warband.id,
          name: warband.name,
          status: warband.status,
          catalogue_name: warband.catalogue_name,
          players: warband.players,
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
          games: gameCells, // Include the game cells in the response
        };
      })
    );

    return NextResponse.json({ warbands: warbandsWithStats });
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
