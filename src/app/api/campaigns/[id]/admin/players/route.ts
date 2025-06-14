import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// GET: list all players in this campaign
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
    }    // Get all players in this campaign with their warbands
    const campaignPlayers = await prisma.players_campaigns.findMany({
      where: { campaign_id: campaignId },
      include: {
        players: {
          select: {
            id: true,
            login: true,
            name: true,
            email: true,
            avatar_url: true,
            notes: true,
            is_active: true,
            idt: true,
            udt: true,
            ldt: true,
          },
        },
      },
      orderBy: { players: { id: 'asc' } },
    });

    // Get warbands for each player in this campaign
    const playersWithWarbands = await Promise.all(
      campaignPlayers.map(async (pc) => {
        const warbands = await prisma.warbands.findMany({
          where: { 
            campaign_id: campaignId,
            player_id: pc.player_id,
          },
          select: {
            id: true,
            name: true,
            status: true,
            catalogue_name: true,
            rosters: {
              select: {
                id: true,
                ducats: true,
                model_count: true,
                glory_points: true,
                game_number: true,
              },
              orderBy: { id: 'asc' },
            },
          },
          orderBy: { id: 'asc' },
        });

        return {
          ...pc.players,
          is_campaign_admin: pc.is_admin,
          warbands,
        };
      })
    );

    return NextResponse.json({ players: playersWithWarbands });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// PATCH: update player campaign info (admin status, notes)
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
    const adminPlayerCampaign = await prisma.players_campaigns.findUnique({
      where: {
        player_id_campaign_id: {
          player_id: user.userId,
          campaign_id: campaignId,
        },
      },
    });

    if (!adminPlayerCampaign?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { playerId, is_admin } = await req.json();
    if (!playerId) {
      return NextResponse.json({ error: 'Missing playerId' }, { status: 400 });
    }

    // Update player's campaign admin status
    const updated = await prisma.players_campaigns.update({
      where: {
        player_id_campaign_id: {
          player_id: playerId,
          campaign_id: campaignId,
        },
      },
      data: {
        is_admin: typeof is_admin !== 'undefined' ? is_admin : undefined,
      },
    });

    return NextResponse.json({ success: true, playerCampaign: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// POST: change player password (global action)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { playerId, password } = await req.json();
    if (!playerId || !password || password.length < 4) {
      return NextResponse.json({ error: 'Missing playerId or password (min 4 chars)' }, { status: 400 });
    }

    // Verify the player is in this campaign
    const targetPlayerCampaign = await prisma.players_campaigns.findUnique({
      where: {
        player_id_campaign_id: {
          player_id: playerId,
          campaign_id: campaignId,
        },
      },
    });

    if (!targetPlayerCampaign) {
      return NextResponse.json({ error: 'Player not found in this campaign' }, { status: 404 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    await prisma.players.update({ 
      where: { id: playerId }, 
      data: { password_hash } 
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// DELETE: remove player from campaign
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
    const adminPlayerCampaign = await prisma.players_campaigns.findUnique({
      where: {
        player_id_campaign_id: {
          player_id: user.userId,
          campaign_id: campaignId,
        },
      },
    });

    if (!adminPlayerCampaign?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { playerId } = await req.json();
    if (!playerId) {
      return NextResponse.json({ error: 'Missing playerId' }, { status: 400 });
    }

    // Don't allow removing oneself
    if (user.userId === playerId) {
      return NextResponse.json({ error: 'Cannot remove yourself from campaign' }, { status: 400 });
    }

    // Remove player from campaign (this will cascade to warbands, rosters, etc.)
    await prisma.players_campaigns.delete({
      where: {
        player_id_campaign_id: {
          player_id: playerId,
          campaign_id: campaignId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
