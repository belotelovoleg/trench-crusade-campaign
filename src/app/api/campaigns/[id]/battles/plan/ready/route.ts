import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../../lib/prisma';
import { requireAuth } from '@/lib/auth';

// PATCH /api/campaigns/[id]/battles/plan/ready
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Require authentication for marking ready
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
    const { game_id } = body;
    if (!game_id) return NextResponse.json({ error: 'Missing game_id' }, { status: 400 });

    const game = await prisma.games.findFirst({ 
      where: { 
        id: game_id,
        campaign_id: campaignId
      }, 
      select: { 
        id: true, 
        warband_1_id: true, 
        warband_2_id: true, 
        player1_isReady: true, 
        player2_isReady: true, 
        status: true 
      } 
    });
    
    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

    // Determine if user is player1 or player2
    const myWarband = await prisma.warbands.findFirst({ 
      where: { 
        player_id: user.id, 
        campaign_id: campaignId,
        id: { in: [game.warband_1_id, game.warband_2_id] } 
      } 
    });
    
    if (!myWarband) return NextResponse.json({ error: 'Not your game' }, { status: 403 });
    
    let update: any = {};
    if (myWarband.id === game.warband_1_id) {
      update.player1_isReady = true;
    } else if (myWarband.id === game.warband_2_id) {
      update.player2_isReady = true;
    } else {
      return NextResponse.json({ error: 'Not your game' }, { status: 403 });
    }

    // If both players are ready (either already or with this update), set status to 'active'
    const willBothBeReady = 
      (update.player1_isReady && game.player2_isReady) || 
      (update.player2_isReady && game.player1_isReady) ||
      (game.player1_isReady && game.player2_isReady);
      
    if (willBothBeReady) {
      update.status = 'active';
    }

    const updated = await prisma.games.update({ where: { id: game_id }, data: update });
    return NextResponse.json({ success: true, game: updated });
  } catch (error) {
    console.error('Error updating game ready status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
