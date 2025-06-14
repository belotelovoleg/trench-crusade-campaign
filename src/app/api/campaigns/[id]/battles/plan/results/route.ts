import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../../lib/prisma';
import { requireAuth } from '@/lib/auth';

// PATCH /api/campaigns/[id]/battles/plan/results
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Require authentication for submitting results
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaignId = parseInt(params.id);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }
    
    const user = await prisma.players.findUnique({ where: { id: authResult.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Verify user is part of this campaign
    const playerCampaign = await prisma.players_campaigns.findFirst({
      where: {
        campaign_id: campaignId,
        player_id: user.id
      }
    });

    if (!playerCampaign) {
      return NextResponse.json({ error: 'Not authorized for this campaign' }, { status: 403 });
    }

    const body = await req.json();
    const { game_id, vp_1, vp_2, gp_1, gp_2, action,
      player1_calledReinforcements,
      player2_calledReinforcements,
      player1_injuries,
      player2_injuries,
      player1_skillAdvancements,
      player2_skillAdvancements,
      player1_becomesElite,
      player2_becomesElite,
      player1_explorationDice,
      player2_explorationDice
    } = body;
    
    if (!game_id) return NextResponse.json({ error: 'Missing game_id' }, { status: 400 });

    // Only allow game participants to submit results
    const game = await prisma.games.findFirst({ 
      where: { 
        id: game_id,
        campaign_id: campaignId
      }, 
      select: {
        id: true,
        warband_1_id: true,
        warband_2_id: true,
        player1_isApprovedResult: true,
        player2_isApprovedResult: true,
        vp_1: true,
        vp_2: true,
        gp_1: true,
        gp_2: true,
        status: true,
      } 
    });
    
    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    
    const warband = await prisma.warbands.findFirst({ 
      where: { 
        player_id: user.id, 
        campaign_id: campaignId,
        id: { in: [game.warband_1_id, game.warband_2_id] } 
      } 
    });
    
    if (!warband) return NextResponse.json({ error: 'Not your game' }, { status: 403 });

    // Determine who is submitting the result
    let update: any = {};
    if (warband.id === game.warband_1_id) {
      update.player1_isApprovedResult = true;
    } else if (warband.id === game.warband_2_id) {
      update.player2_isApprovedResult = true;
    }

    // If acting as approve/reject (confirmation step)
    if (action === 'approve') {
      // Confirmation by opponent
      if (warband.id === game.warband_1_id) {
        update.player1_isApprovedResult = true;
      } else if (warband.id === game.warband_2_id) {
        update.player2_isApprovedResult = true;
      }
      // If both confirmed — status finished
      if ((game.player1_isApprovedResult || update.player1_isApprovedResult) && (game.player2_isApprovedResult || update.player2_isApprovedResult)) {
        update.status = 'finished';
      }
    } else if (action === 'reject') {
      // Rejection — reset results, status active
      update = {
        vp_1: 0,
        vp_2: 0,
        gp_1: 0,
        gp_2: 0,
        player1_isApprovedResult: false,
        player2_isApprovedResult: false,
        status: 'active',
      };
    } else {
      // Submitting result — status pending_approval
      // First reset confirmations from both players
      update.player1_isApprovedResult = false;
      update.player2_isApprovedResult = false;
      
      // Then set confirmation for current player
      if (warband.id === game.warband_1_id) {
        update.player1_isApprovedResult = true;
      } else if (warband.id === game.warband_2_id) {
        update.player2_isApprovedResult = true;
      }
      
      update.vp_1 = typeof vp_1 === 'number' ? vp_1 : 0;
      update.vp_2 = typeof vp_2 === 'number' ? vp_2 : 0;
      update.gp_1 = typeof gp_1 === 'number' ? gp_1 : 0;
      update.gp_2 = typeof gp_2 === 'number' ? gp_2 : 0;
      update.status = 'pending_approval';
      
      // New fields
      function normalizeArray(arr: any) {
        if (!Array.isArray(arr)) return [];
        return arr
          .filter((x) => x && typeof x.name === 'string' && x.name.trim() && x.roll !== undefined && x.roll !== null && String(x.roll).trim() !== '')
          .map((x) => ({ name: x.name.trim(), roll: Number(x.roll) }));
      }
      
      function normalizeNameOnlyArray(arr: any) {
        if (!Array.isArray(arr)) return [];
        return arr
          .filter((x) => x && typeof x.name === 'string' && x.name.trim())
          .map((x) => ({ name: x.name.trim() }));
      }
      
      if (typeof player1_calledReinforcements === 'boolean') update.player1_calledReinforcements = player1_calledReinforcements;
      if (typeof player2_calledReinforcements === 'boolean') update.player2_calledReinforcements = player2_calledReinforcements;
      if (player1_injuries !== undefined) update.player1_injuries = normalizeArray(player1_injuries);
      if (player2_injuries !== undefined) update.player2_injuries = normalizeArray(player2_injuries);
      if (player1_skillAdvancements !== undefined) update.player1_skillAdvancements = normalizeArray(player1_skillAdvancements);
      if (player2_skillAdvancements !== undefined) update.player2_skillAdvancements = normalizeArray(player2_skillAdvancements);
      if (player1_becomesElite !== undefined) update.player1_becomesElite = normalizeNameOnlyArray(player1_becomesElite);
      if (player2_becomesElite !== undefined) update.player2_becomesElite = normalizeNameOnlyArray(player2_becomesElite);
      if (typeof player1_explorationDice === 'number') update.player1_explorationDice = player1_explorationDice;
      if (typeof player2_explorationDice === 'number') update.player2_explorationDice = player2_explorationDice;
    }

    const updated = await prisma.games.update({
      where: { id: game_id },
      data: update,
    });

    // If game is finished (both confirmed), update warband status
    if (update.status === 'finished') {
      await prisma.warbands.updateMany({
        where: {
          id: { in: [game.warband_1_id, game.warband_2_id] },
          campaign_id: campaignId
        },
        data: { status: 'needs_update' }
      });
    }

    return NextResponse.json({ success: true, game: updated });
  } catch (error) {
    console.error('Error updating game results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
