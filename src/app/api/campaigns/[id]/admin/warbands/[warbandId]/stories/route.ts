import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET: get all stories and games for warband
export async function GET(
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

    // Get warband with stories and games (campaign-specific)
    const warband = await prisma.warbands.findFirst({
      where: { 
        id: warbandId,
        campaign_id: campaignId
      },
      include: {
        stories: true,
        games_games_warband_1_idTowarbands: {
          where: { campaign_id: campaignId },
          include: { warbands_games_warband_2_idTowarbands: { select: { name: true } } },
        },
        games_games_warband_2_idTowarbands: {
          where: { campaign_id: campaignId },
          include: { warbands_games_warband_1_idTowarbands: { select: { name: true } } },
        },
      },
    });

    if (!warband) {
      return NextResponse.json({ error: 'Warband not found in this campaign' }, { status: 404 });
    }

    // Collect games
    const games: any[] = [];
    (warband.games_games_warband_1_idTowarbands || []).forEach((g: any) => {
      games.push({
        id: g.id,
        number: g.warband_1_gameNumber,
        status: g.status,
        opponent: g.warbands_games_warband_2_idTowarbands?.name || '',
        vp: g.vp_1,
        gp: g.gp_1,
        opponent_vp: g.vp_2,
        opponent_gp: g.gp_2,
      });
    });
    (warband.games_games_warband_2_idTowarbands || []).forEach((g: any) => {
      games.push({
        id: g.id,
        number: g.warband_2_gameNumber,
        status: g.status,
        opponent: g.warbands_games_warband_1_idTowarbands?.name || '',
        vp: g.vp_2,
        gp: g.gp_2,
        opponent_vp: g.vp_1,
        opponent_gp: g.gp_1,
      });
    });

    // Stories: array {number, html}
    const stories = (warband.stories || []).map((s: any) => ({ 
      number: s.game_id ?? 0, 
      html: s.text || '' 
    }));

    return NextResponse.json({ stories, games });
  } catch (error) {
    console.error('Error fetching warband stories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: save/update story for warband+game_number
export async function PATCH(
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

    const body = await req.json();
    const { number, html } = body;
    if (typeof number !== 'number') {
      return NextResponse.json({ error: 'Missing number' }, { status: 400 });
    }

    // Update or create story
    const existing = await prisma.stories.findFirst({ 
      where: { 
        warband_id: warbandId, 
        game_id: number 
      } 
    });

    if (existing) {
      await prisma.stories.update({ 
        where: { id: existing.id }, 
        data: { text: html } 
      });
    } else {
      await prisma.stories.create({ 
        data: { 
          warband_id: warbandId, 
          game_id: number, 
          text: html 
        } 
      });
    }

    // Return updated array
    const all = await prisma.stories.findMany({ where: { warband_id: warbandId } });
    const stories = all.map((s: any) => ({ 
      number: s.game_id ?? 0, 
      html: s.text || '' 
    }));

    return NextResponse.json({ stories });
  } catch (error) {
    console.error('Error updating warband story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
