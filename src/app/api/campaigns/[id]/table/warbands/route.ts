import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/campaigns/[id]/table/warbands
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Require authentication to view campaign table
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaignId = parseInt(params.id);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
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

    // Get all warbands in this campaign (like old API but campaign-specific)
    const warbands = await prisma.warbands.findMany({
      where: { 
        campaign_id: campaignId,
        status: { not: 'deleted' } 
      },
      include: {
        players: { select: { id: true, name: true, avatar_url: true } },
        games_games_warband_1_idTowarbands: {
          where: { campaign_id: campaignId },
          include: {
            warbands_games_warband_2_idTowarbands: { select: { name: true } },
          },
        },
        games_games_warband_2_idTowarbands: {
          where: { campaign_id: campaignId },
          include: {
            warbands_games_warband_1_idTowarbands: { select: { name: true } },
          },
        },
        rosters: {
          select: {
            id: true,
            game_number: true,
            model_count: true,
            ducats: true,
            glory_points: true,
          },
          orderBy: { game_number: 'desc' }
        }
      },
      orderBy: { id: 'desc' },
    });

    // Get all games for this campaign
    const allGames = await prisma.games.findMany({
      where: { 
        campaign_id: campaignId,
        status: { in: ['finished', 'planned', 'active', 'pending_approval'] } 
      },
      select: {
        id: true,
        status: true,
        warband_1_id: true,
        warband_2_id: true,
        warband_1_gameNumber: true,
        warband_2_gameNumber: true,
        vp_1: true,
        vp_2: true,
        gp_1: true,
        gp_2: true,
        warbands_games_warband_1_idTowarbands: { select: { name: true } },
        warbands_games_warband_2_idTowarbands: { select: { name: true } },
      }
    });

    // Process warbands with games and rosters (like old API)
    const result = warbands.map((w: any) => {
      // Map roster file_urls to campaign-specific endpoints
      const rosters = (w.rosters || []).map((r: any) => ({
        ...r,
        file_url: r.id ? `/api/campaigns/${campaignId}/rosters/${r.id}` : null
      }));

      // Collect all games for this warband
      const games = allGames.filter(
        (g: any) => g.warband_1_id === w.id || g.warband_2_id === w.id
      ).map((g: any) => {
        const is1 = g.warband_1_id === w.id;
        return {
          id: g.id,
          number: is1 ? g.warband_1_gameNumber : g.warband_2_gameNumber,
          status: g.status,
          opponent: is1
            ? g.warbands_games_warband_2_idTowarbands?.name || ''
            : g.warbands_games_warband_1_idTowarbands?.name || '',
          vp: is1 ? g.vp_1 : g.vp_2,
          gp: is1 ? g.gp_1 : g.gp_2,
          opponent_vp: is1 ? g.vp_2 : g.vp_1,
          opponent_gp: is1 ? g.gp_2 : g.gp_1,
        };
      });

      // Calculate total victory points for this warband
      const total_vp = games.reduce((sum: number, g: any) => sum + (typeof g.vp === 'number' ? g.vp : 0), 0);
      
      return {
        ...w,
        rosters,
        games,
        total_vp,
      };
    });

    return NextResponse.json({ warbands: result });
  } catch (error) {
    console.error('Error fetching campaign table:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
