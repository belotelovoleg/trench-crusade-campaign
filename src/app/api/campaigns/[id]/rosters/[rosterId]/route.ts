import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/campaigns/[id]/rosters/[rosterId]
export async function GET(
  req: Request,
  { params }: { params: { id: string, rosterId: string } }
) {
  // Require authentication to view rosters
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(req.url);
    const campaignId = parseInt(params.id);
    const rosterId = parseInt(params.rosterId);
    
    // Also support query parameters for flexibility like the old API
    const warbandId = searchParams.get('warband_id');
    const gameNumber = searchParams.get('game_number');
    
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
    }

    let roster: { id: number; file_content: string | null } | null = null;

    if (warbandId && gameNumber) {
      // Find roster by warband_id and game_number (like old API)
      roster = await prisma.rosters.findFirst({
        where: {
          warband_id: Number(warbandId),
          game_number: Number(gameNumber),
          warbands: {
            campaign_id: campaignId
          }
        },
        select: { id: true, file_content: true, warbands: true },
      });
    } else if (!isNaN(rosterId)) {
      // Find roster by rosterId
      roster = await prisma.rosters.findFirst({
        where: {
          id: rosterId,
          warbands: {
            campaign_id: campaignId
          }
        },
        select: { id: true, file_content: true, warbands: true },
      });
    } else {
      return NextResponse.json({ 
        error: 'roster_id is required', 
        code: 'bad_request', 
        reason: 'missing_param' 
      }, { status: 400 });
    }

    if (!roster) {
      return NextResponse.json({ 
        error: 'Roster not found in database', 
        code: 'not_found', 
        reason: 'db' 
      }, { status: 404 });
    }

    if (!roster.file_content) {
      return NextResponse.json({ 
        error: 'Roster content missing in database', 
        code: 'not_found', 
        reason: 'db_file_content' 
      }, { status: 404 });
    }

    // Return the roster file as downloadable JSON (like old API)
    const fileName = `roster_${roster.id}.json`;
    return new Response(roster.file_content, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  } catch (error) {
    console.error('Error retrieving roster:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
