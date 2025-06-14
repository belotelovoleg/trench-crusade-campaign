import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/campaigns/[id]/admin/warbands
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Require authentication for admin actions
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaignId = parseInt(params.id);

    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
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

    // Get all warbands in this campaign for admin view
    const warbands = await prisma.warbands.findMany({
      where: {
        campaign_id: campaignId
      },
      include: {
        players: {
          select: {
            id: true,
            name: true,
            login: true,
            avatar_url: true
          }
        },
        rosters: {
          select: {
            id: true,
            game_number: true,
            model_count: true,
            ducats: true,
            glory_points: true,
            uploaded_at: true
          },
          orderBy: { game_number: 'desc' },
          take: 3 // Latest 3 rosters for admin overview
        }
      },
      orderBy: { id: 'desc' }
    });

    return NextResponse.json({ warbands });
  } catch (error) {
    console.error('Error fetching admin warbands:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}