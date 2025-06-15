// API для отримання інформації про окрему кампанію
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperAdmin } from '@/lib/auth';

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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Require super admin privileges to edit campaigns
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaignId = parseInt(params.id);
    
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    // Check if campaign exists
    const existingCampaign = await prisma.campaigns.findUnique({
      where: { id: campaignId }
    });

    if (!existingCampaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Parse the request data
    const contentType = request.headers.get('content-type') || '';
      let name: string;
    let description: string | null = null;
    let imageBase64: string | null = null;
    let warband_limit: number | undefined;
    
    if (contentType.includes('application/json')) {
      const json = await request.json();
      name = json.name;
      description = json.description || null;
      if (json.warband_limit !== undefined) {
        warband_limit = Math.max(1, Math.min(10, parseInt(json.warband_limit) || 2));
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = formData.get('name') as string;
      description = formData.get('description') as string || null;
      if (formData.get('warband_limit')) {
        warband_limit = Math.max(1, Math.min(10, parseInt(formData.get('warband_limit') as string) || 2));
      }
      
      const imageFile = formData.get('image') as File;
      if (imageFile && imageFile.size > 0) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        imageBase64 = `data:${imageFile.type};base64,${buffer.toString('base64')}`;
      }
    }else {
      return NextResponse.json(
        { error: 'Unsupported content type' },
        { status: 400 }
      );
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }    // Update campaign
    const updateData: any = {
      name: name.trim(),
      description: description?.trim() || null,
      updated_at: new Date()
    };

    // Only update image if a new one was provided
    if (imageBase64) {
      updateData.image = imageBase64;
    }

    // Only update warband_limit if provided
    if (warband_limit !== undefined) {
      updateData.warband_limit = warband_limit;
    }

    const updatedCampaign = await prisma.campaigns.update({
      where: { id: campaignId },
      data: updateData
    });

    return NextResponse.json({ campaign: updatedCampaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}
