import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/campaigns/[id]/battles?warband_id=ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Require authentication to view battles
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaignId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const warbandId = Number(searchParams.get('warband_id'));
    
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    if (!warbandId) {
      return NextResponse.json({ error: 'warband_id required' }, { status: 400 });
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

    // Get the warband (like old API but campaign-specific)
    const warband = await prisma.warbands.findUnique({
      where: { 
        id: warbandId,
        campaign_id: campaignId // Ensure warband belongs to this campaign
      },
      include: {
        players: { select: { id: true, name: true, avatar_url: true } },
        rosters: { 
          select: { id: true, model_count: true, ducats: true, glory_points: true, game_number: true },
          orderBy: { game_number: 'desc' }
        },
      },
    });

    if (!warband) {
      return NextResponse.json({ error: 'Warband not found in this campaign' }, { status: 404 });
    }

    // Get all games for this warband in this campaign (like old API)
    const games = await prisma.games.findMany({
      where: {
        campaign_id: campaignId,
        OR: [
          { warband_1_id: warbandId },
          { warband_2_id: warbandId },
        ],
      },
      include: {
        warbands_games_warband_1_idTowarbands: {
          select: {
            id: true,
            name: true,
            catalogue_name: true,
            players: { select: { id: true, name: true, avatar_url: true } },
            rosters: { 
              select: { id: true, model_count: true, ducats: true, glory_points: true, game_number: true },
              orderBy: { game_number: 'desc' },
              take: 1
            },
          }
        },
        warbands_games_warband_2_idTowarbands: {
          select: {
            id: true,
            name: true,
            catalogue_name: true,
            players: { select: { id: true, name: true, avatar_url: true } },
            rosters: { 
              select: { id: true, model_count: true, ducats: true, glory_points: true, game_number: true },
              orderBy: { game_number: 'desc' },
              take: 1
            },
          }
        }
      },
      orderBy: { id: 'asc' },
    });

    // Process games to add convenience fields (like old API)
    for (const g of games) {
      if (g.warbands_games_warband_1_idTowarbands && g.warbands_games_warband_1_idTowarbands.rosters.length > 0) {
        const r = g.warbands_games_warband_1_idTowarbands.rosters[0];
        (g.warbands_games_warband_1_idTowarbands as any).modelCount = r.model_count || 0;
        (g.warbands_games_warband_1_idTowarbands as any).ducats = r.ducats || 0;
        (g.warbands_games_warband_1_idTowarbands as any).gloryPoints = r.glory_points || 0;
      }
      if (g.warbands_games_warband_2_idTowarbands && g.warbands_games_warband_2_idTowarbands.rosters.length > 0) {
        const r = g.warbands_games_warband_2_idTowarbands.rosters[0];
        (g.warbands_games_warband_2_idTowarbands as any).modelCount = r.model_count || 0;
        (g.warbands_games_warband_2_idTowarbands as any).ducats = r.ducats || 0;
        (g.warbands_games_warband_2_idTowarbands as any).gloryPoints = r.glory_points || 0;
      }
      // Attach player IDs for frontend convenience
      (g as any).player1_id = (g as any).player1_id ?? g.warbands_games_warband_1_idTowarbands?.players?.id ?? null;
      (g as any).player2_id = (g as any).player2_id ?? g.warbands_games_warband_2_idTowarbands?.players?.id ?? null;
    }

    // Get stories for this warband (like old API)
    const stories = await prisma.stories.findMany({
      where: { warband_id: warbandId },
      select: { game_id: true, text: true },
    });

    // Map file URLs for campaign-specific endpoints
    function mapRosters(rosters: any[]) {
      return (rosters || []).map(r => ({
        ...r,
        file_url: r.id ? `/api/campaigns/${campaignId}/rosters/${r.id}` : null
      }));
    }

    if (warband && warband.rosters) {
      warband.rosters = mapRosters(warband.rosters);
    }

    // Map roster URLs in games
    for (const g of games) {
      if (g.warbands_games_warband_1_idTowarbands && g.warbands_games_warband_1_idTowarbands.rosters) {
        g.warbands_games_warband_1_idTowarbands.rosters = mapRosters(g.warbands_games_warband_1_idTowarbands.rosters);
      }
      if (g.warbands_games_warband_2_idTowarbands && g.warbands_games_warband_2_idTowarbands.rosters) {
        g.warbands_games_warband_2_idTowarbands.rosters = mapRosters(g.warbands_games_warband_2_idTowarbands.rosters);
      }
    }

    return NextResponse.json({ warband, games, stories });
  } catch (error) {
    console.error('Error fetching campaign battles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
