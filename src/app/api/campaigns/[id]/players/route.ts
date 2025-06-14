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
    });

    if (!userCampaign) {
      return NextResponse.json({ error: 'Not authorized for this campaign' }, { status: 403 });
    }// Get players who have warbands in this campaign
    const players = await prisma.players.findMany({
      where: {
        warbands: {
          some: {
            campaign_id: campaignId
          }
        }
      },
      select: {
        id: true,
        name: true,
        login: true,
        avatar_url: true,
        notes: true,
        idt: true, // Include registration date
        udt: true, // Include updated date
        ldt: true, // Include last login date
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
      orderBy: { name: 'asc' },
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
