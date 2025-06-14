import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: list all games in this campaign
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = parseInt(params.id);
    if (!campaignId) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    // Require authentication and campaign admin rights
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    // Check if user is admin of this campaign
    const playerCampaign = await prisma.players_campaigns.findUnique({
      where: {
        player_id_campaign_id: {
          player_id: user.userId,
          campaign_id: campaignId,
        },
      },
    });

    if (!playerCampaign?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get games for this campaign only
    const games = await prisma.games.findMany({
      where: {
        OR: [
          {
            warbands_games_warband_1_idTowarbands: {
              campaign_id: campaignId,
            },
          },
          {
            warbands_games_warband_2_idTowarbands: {
              campaign_id: campaignId,
            },
          },
        ],
      },
      orderBy: { id: 'desc' },
      include: {
        warbands_games_warband_1_idTowarbands: {
          include: {
            players: {
              select: {
                id: true,
                login: true,
                name: true,
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
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ games });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// DELETE: delete a game (only if both warbands belong to this campaign)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = parseInt(params.id);
    if (!campaignId) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    // Require authentication and campaign admin rights
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    // Check if user is admin of this campaign
    const playerCampaign = await prisma.players_campaigns.findUnique({
      where: {
        player_id_campaign_id: {
          player_id: user.userId,
          campaign_id: campaignId,
        },
      },
    });

    if (!playerCampaign?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const gameIdStr = searchParams.get('id');
    if (!gameIdStr) {
      return NextResponse.json({ error: 'Missing game id' }, { status: 400 });
    }

    const gameId = parseInt(gameIdStr);

    // Verify the game involves warbands from this campaign
    const game = await prisma.games.findUnique({
      where: { id: gameId },
      include: {
        warbands_games_warband_1_idTowarbands: true,
        warbands_games_warband_2_idTowarbands: true,
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Check if both warbands belong to this campaign
    if (
      game.warbands_games_warband_1_idTowarbands.campaign_id !== campaignId ||
      game.warbands_games_warband_2_idTowarbands.campaign_id !== campaignId
    ) {
      return NextResponse.json({ error: 'Game does not belong to this campaign' }, { status: 403 });
    }

    await prisma.games.delete({ where: { id: gameId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// PATCH: update a game (only if both warbands belong to this campaign)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = parseInt(params.id);
    if (!campaignId) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    // Require authentication and campaign admin rights
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    // Check if user is admin of this campaign
    const playerCampaign = await prisma.players_campaigns.findUnique({
      where: {
        player_id_campaign_id: {
          player_id: user.userId,
          campaign_id: campaignId,
        },
      },
    });

    if (!playerCampaign?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { id: gameId, ...updateFields } = body;
    if (!gameId) {
      return NextResponse.json({ error: 'Missing game id' }, { status: 400 });
    }

    // Verify the game involves warbands from this campaign
    const game = await prisma.games.findUnique({
      where: { id: gameId },
      include: {
        warbands_games_warband_1_idTowarbands: true,
        warbands_games_warband_2_idTowarbands: true,
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Check if both warbands belong to this campaign
    if (
      game.warbands_games_warband_1_idTowarbands.campaign_id !== campaignId ||
      game.warbands_games_warband_2_idTowarbands.campaign_id !== campaignId
    ) {
      return NextResponse.json({ error: 'Game does not belong to this campaign' }, { status: 403 });
    }

    const updated = await prisma.games.update({
      where: { id: gameId },
      data: updateFields,
    });

    return NextResponse.json({ success: true, game: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
