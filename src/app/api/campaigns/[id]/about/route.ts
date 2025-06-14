// API для отримання about_campaign по ID кампанії
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Require authentication to view campaign about
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  try {    const campaignId = parseInt(params.id);
    
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    // We don't need to verify campaign membership for viewing basic campaign info
    // Just check if campaign exists
    const campaign = await prisma.campaigns.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const about = await prisma.about_campaign.findFirst({
      where: { campaign_id: campaignId }
    });
    
    const response = NextResponse.json({ content: about?.content || '' });
    
    // Disable caching to get fresh content immediately
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching campaign about:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaignId = parseInt(params.id);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    const userCampaign = await prisma.players_campaigns.findFirst({
      where: {
        campaign_id: campaignId,
        player_id: authResult.userId,
      },
    });

    if (!userCampaign) {
      return NextResponse.json({ error: 'Not authorized for this campaign' }, { status: 403 });
    }

    const body = await request.json();
    const content = body.content;

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid content format' }, { status: 400 });
    }    // First check if about_campaign entry exists for this campaign
    const existingAbout = await prisma.about_campaign.findFirst({
      where: { campaign_id: campaignId }
    });

    if (existingAbout) {
      // Update existing record
      await prisma.about_campaign.update({
        where: { id: existingAbout.id },
        data: { content }
      });
    } else {
      // Create new record
      await prisma.about_campaign.create({
        data: { campaign_id: campaignId, content }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating campaign about:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
