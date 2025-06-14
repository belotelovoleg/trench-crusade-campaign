// API для отримання інформації про окрему кампанію
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Require authentication to view campaign info
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  try {
    const campaignId = parseInt(params.id);
    
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    // Check if user is a member of this campaign
    const userCampaign = await prisma.players_campaigns.findFirst({
      where: {
        campaign_id: campaignId,
        player_id: authResult.userId
      },
      select: {
        is_admin: true
      }
    });

    // Continue with campaign lookup regardless of membership
    const campaign = await prisma.campaigns.findUnique({
      where: { id: campaignId },
      include: {
        _count: {
          select: {
            players_campaigns: true,
            warbands: true
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        image: campaign.image,
        created_at: campaign.created_at,
        is_active: campaign.is_active,
        updated_at: campaign.updated_at,
        _count: {
          users: campaign._count.players_campaigns,
          warbands: campaign._count.warbands
        },
        is_member: !!userCampaign,
        is_admin: !!userCampaign?.is_admin
      }
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
