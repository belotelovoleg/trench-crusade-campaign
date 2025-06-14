import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/campaigns/[id]/players
export async function GET(req: Request, { params }: { params: { id: string } }) {
  // Require authentication to view campaign players
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
    });    if (!userCampaign) {
      return NextResponse.json({ error: 'Not authorized for this campaign' }, { status: 403 });
    }
      // Get players who have warbands in this campaign
    const playersData = await prisma.players.findMany({
      where: {
        warbands: {
          some: {
            campaign_id: campaignId
          }
        }
      },      select: {
        id: true,
        name: true,
        login: true,
        avatar_url: true,
        notes: true,
        is_active: true, // Include active status from players table        is_super_admin: true, // Include super admin status
        idt: true, // Include registration date
        udt: true, // Include updated date
        ldt: true, // Include last login date
        players_campaigns: {
          where: {
            campaign_id: campaignId
          },
          select: {
            is_admin: true
          }
        },
        warbands: {
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
              orderBy: { game_number: 'asc' },
            },
          },
          where: { 
            status: { not: 'deleted' },
            campaign_id: campaignId
          },
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { name: 'asc' },    });
    
    // Transform the data to include campaign-specific admin status
    const players = playersData.map(player => {
      const campaignAdmin = player.players_campaigns[0]?.is_admin || false;
      // Remove the players_campaigns array and add is_admin field
      const { players_campaigns, ...rest } = player;
      return {
        ...rest,
        is_admin: campaignAdmin, // This is the campaign-specific admin status
      };
    });
    
    return NextResponse.json({ players });
  } catch (error) {
    console.error('Error fetching campaign players:', error);
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}

// PATCH /api/campaigns/[id]/players
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaignId = parseInt(params.id);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    const body = await req.json();
    const { id, warbands, ...updateData } = body; // Exclude `warbands` from update data

    // Verify the requesting user has access to this campaign
    const userCampaign = await prisma.players_campaigns.findFirst({
      where: {
        campaign_id: campaignId,
        player_id: authResult.userId,
      },
    });

    if (!userCampaign) {
      return NextResponse.json({ error: 'Not authorized for this campaign' }, { status: 403 });
    }

    // Update player data
    const playerData = { ...updateData };
    
    // Handle is_admin as a special case
    if (playerData.is_admin !== undefined) {
      // Update admin status in players_campaigns table
      await prisma.players_campaigns.updateMany({
        where: {
          campaign_id: campaignId,
          player_id: id,
        },
        data: { is_admin: playerData.is_admin },
      });
      delete playerData.is_admin; // Remove is_admin from player update data
    }

    // Handle is_super_admin as a special case
    if (playerData.is_super_admin !== undefined) {
      // Need to verify the user has permission to update is_super_admin
      // Only existing super admins should be able to grant this permission
      if (!userCampaign.is_admin && !authResult.is_super_admin) {
        return NextResponse.json({ error: 'Not authorized to modify super admin status' }, { status: 403 });
      }
    }

    // Update player data
    const updatedPlayer = await prisma.players.update({
      where: { id },
      data: playerData, // Only valid fields are updated
    });

    return NextResponse.json({ player: updatedPlayer });
  } catch (error) {
    console.error('Error updating player:', error);
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
  }
}

// POST /api/campaigns/[id]/players - Used for password changes
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaignId = parseInt(params.id);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    const body = await req.json();
    const { id, password } = body;

    if (!id || !password) {
      return NextResponse.json({ error: 'Player ID and password are required' }, { status: 400 });
    }

    // Verify the requesting user has admin access to this campaign
    const userCampaign = await prisma.players_campaigns.findFirst({
      where: {
        campaign_id: campaignId,
        player_id: authResult.userId,
      },
    });

    if (!userCampaign || !userCampaign.is_admin) {
      return NextResponse.json({ error: 'Admin privileges required for this action' }, { status: 403 });
    }    // Update the password
    const bcrypt = require('bcryptjs');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const updatedPlayer = await prisma.players.update({
      where: { id },
      data: { 
        password_hash: hashedPassword,
        udt: new Date() // Update the update timestamp
      },
    });

    return NextResponse.json({ 
      success: true, 
      player: {
        id: updatedPlayer.id,
        login: updatedPlayer.login,
        name: updatedPlayer.name,
        email: updatedPlayer.email,
        avatar_url: updatedPlayer.avatar_url,
        notes: updatedPlayer.notes,
        is_active: updatedPlayer.is_active,
        is_super_admin: updatedPlayer.is_super_admin,
        idt: updatedPlayer.idt,
        udt: updatedPlayer.udt,
        ldt: updatedPlayer.ldt
      }
    });
  } catch (error) {
    console.error('Error updating player password:', error);
    return NextResponse.json({ error: 'Failed to update player password' }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id]/players
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaignId = parseInt(params.id);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    const body = await req.json();
    const { id } = body; // Get player ID to remove

    if (!id) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    // Verify the requesting user has admin access to this campaign
    const userCampaign = await prisma.players_campaigns.findFirst({
      where: {
        campaign_id: campaignId,
        player_id: authResult.userId,
      },
    });

    if (!userCampaign || !userCampaign.is_admin) {
      return NextResponse.json({ error: 'Admin privileges required for this action' }, { status: 403 });
    }

    // First, get all the warbands of this player in this campaign
    const playerWarbands = await prisma.warbands.findMany({
      where: {
        campaign_id: campaignId,
        player_id: id,
      },
      select: {
        id: true,
      },
    });

    const warbandIds = playerWarbands.map(wb => wb.id);    // Start a transaction to ensure all related data is deleted properly
    await prisma.$transaction(async (tx) => {
      // 1. Delete all rosters for these warbands
      if (warbandIds.length > 0) {
        await tx.rosters.deleteMany({
          where: {
            warband_id: {
              in: warbandIds,
            },
          },
        });

        // 2. Delete all stories for these warbands
        await tx.stories.deleteMany({
          where: {
            warband_id: {
              in: warbandIds,
            },
          },
        });

        // 3. Handle games - update their status to cancelled if they involve the player's warbands
        await tx.games.updateMany({
          where: {
            OR: [
              { warband_1_id: { in: warbandIds } },
              { warband_2_id: { in: warbandIds } },
            ],
            status: {
              in: ['planned', 'active']
            }
          },
          data: {
            status: 'cancelled',
          },
        });

        // 4. Delete the warbands themselves
        await tx.warbands.deleteMany({
          where: {
            id: {
              in: warbandIds,
            },
          },
        });
      }

      // 4. Finally, remove the player from the campaign
      await tx.players_campaigns.deleteMany({
        where: {
          campaign_id: campaignId,
          player_id: id,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing player from campaign:', error);
    return NextResponse.json({ error: 'Failed to remove player from campaign' }, { status: 500 });
  }
}
