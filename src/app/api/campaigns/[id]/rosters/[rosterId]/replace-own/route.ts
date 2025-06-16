import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: { id: string; rosterId: string } }) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaignId = parseInt(params.id);
    const rosterId = parseInt(params.rosterId);
    
    if (isNaN(campaignId) || isNaN(rosterId)) {
      return NextResponse.json({ error: 'Invalid campaign or roster ID' }, { status: 400 });
    }

    // Verify the requesting user is part of this campaign
    const userCampaign = await prisma.players_campaigns.findFirst({
      where: {
        campaign_id: campaignId,
        player_id: authResult.userId,
      },
    });

    if (!userCampaign) {
      return NextResponse.json({ error: 'Not authorized for this campaign' }, { status: 403 });
    }

    // Get the roster and verify it belongs to a warband owned by this user
    const roster = await prisma.rosters.findFirst({
      where: { id: rosterId },
      include: {
        warbands: {
          select: { 
            campaign_id: true,
            player_id: true,
            name: true,
            catalogue_name: true,
            status: true
          }
        }
      }
    });

    if (!roster || roster.warbands.campaign_id !== campaignId) {
      return NextResponse.json({ error: 'Roster not found in this campaign' }, { status: 404 });
    }

    // Verify the warband belongs to the requesting user
    if (roster.warbands.player_id !== authResult.userId) {
      return NextResponse.json({ error: 'You can only replace your own rosters' }, { status: 403 });
    }

    // Only allow replacement if warband is in 'checking' status
    if (roster.warbands.status !== 'checking') {
      return NextResponse.json({ error: 'Roster replacement is only allowed for warbands under review' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.json')) {
      return NextResponse.json({ error: 'File must be a JSON file' }, { status: 400 });
    }

    const fileContent = await file.text();
    let parsedRoster;
    
    try {
      parsedRoster = JSON.parse(fileContent);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 });
    }

    // Validate roster structure
    if (!parsedRoster.roster || !parsedRoster.roster.forces || !Array.isArray(parsedRoster.roster.forces)) {
      return NextResponse.json({ error: 'Invalid roster format' }, { status: 400 });
    }

    // Check if warband name matches
    const rosterName = parsedRoster.roster.name;
    if (rosterName !== roster.warbands.name) {
      return NextResponse.json({ 
        error: `Warband name mismatch. Expected: "${roster.warbands.name}", but roster contains: "${rosterName}"` 
      }, { status: 400 });
    }    // Check if catalogue (faction) matches
    const catalogueName = parsedRoster.roster.forces[0]?.catalogueName;
    if (catalogueName !== roster.warbands.catalogue_name) {
      return NextResponse.json({ 
        error: `Faction mismatch. Expected: "${roster.warbands.catalogue_name}", but roster contains: "${catalogueName}"` 
      }, { status: 400 });
    }

    // Calculate roster statistics
    let totalCost = 0;
    let modelCount = 0;

    const calculateModelCostAndCount = (selections: any[]) => {
      for (const selection of selections) {
        if (selection.type === 'model') {
          modelCount++;
          totalCost += selection.cost || 0;
        }
        if (selection.selections) {
          calculateModelCostAndCount(selection.selections);
        }
      }
    };

    parsedRoster.roster.forces.forEach((force: any) => {
      if (force.selections) {
        calculateModelCostAndCount(force.selections);
      }
    });    // Create file URL (same logic as original)
    const timestamp = Date.now();
    const fileName = `${(roster.warbands.name || 'warband').replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.json`;
    const fileUrl = `/rosters/${fileName}`;

    // Update the roster
    await prisma.rosters.update({
      where: { id: rosterId },
      data: {
        file_url: fileUrl,
        file_content: fileContent,
        ducats: totalCost,
        model_count: modelCount,
        uploaded_at: new Date(),
        description: `Replaced by player on ${new Date().toISOString()}`
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Roster replaced successfully',
      ducats: totalCost,
      model_count: modelCount 
    });

  } catch (error) {
    console.error('Error replacing roster:', error);
    return NextResponse.json({ error: 'Failed to replace roster' }, { status: 500 });
  }
}
