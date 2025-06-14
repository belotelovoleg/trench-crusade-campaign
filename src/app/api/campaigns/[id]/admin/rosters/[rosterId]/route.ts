import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/campaigns/[id]/admin/rosters/[rosterId]
export async function GET(
  req: Request, 
  { params }: { params: { id: string; rosterId: string } }
) {
  // Require authentication for admin actions
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaignId = parseInt(params.id);
    const rosterId = parseInt(params.rosterId);

    if (isNaN(campaignId) || isNaN(rosterId)) {
      return NextResponse.json({ error: 'Invalid campaign ID or roster ID' }, { status: 400 });
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

    // Get roster that belongs to this campaign
    const roster = await prisma.rosters.findFirst({
      where: { 
        id: rosterId,
        warbands: {
          campaign_id: campaignId
        }
      },
      select: {
        id: true,
        warband_id: true,
        file_content: true,
        description: true,
        game_number: true,
        model_count: true,
        ducats: true,
        glory_points: true,
        uploaded_at: true,
        warbands: {
          select: {
            id: true,
            name: true,
            catalogue_name: true,
            players: {
              select: {
                id: true,
                name: true,
                login: true
              }
            }
          }
        }
      }
    });

    if (!roster) {
      return NextResponse.json({ error: 'Roster not found in this campaign' }, { status: 404 });
    }

    return NextResponse.json(roster);
  } catch (error) {
    console.error('Error fetching roster:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
