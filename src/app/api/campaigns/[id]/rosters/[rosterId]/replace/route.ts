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

    // Verify the requesting user has admin access to this campaign
    const userCampaign = await prisma.players_campaigns.findFirst({
      where: {
        campaign_id: campaignId,
        player_id: authResult.userId,
      },
    });

    if (!userCampaign || !userCampaign.is_admin) {
      return NextResponse.json({ error: 'Admin privileges required for this action' }, { status: 403 });
    }    // Get the roster and verify it belongs to a warband in this campaign
    const roster = await prisma.rosters.findFirst({
      where: { id: rosterId },
      include: {
        warbands: {
          select: { 
            campaign_id: true,
            name: true,
            catalogue_name: true
          }
        }
      }
    });

    if (!roster || roster.warbands.campaign_id !== campaignId) {
      return NextResponse.json({ error: 'Roster not found in this campaign' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }    // Read file content
    const fileContent = await file.text();
    
    // Validate JSON
    let rosterData;
    try {
      rosterData = JSON.parse(fileContent);
    } catch (error) {
      return NextResponse.json({ 
        userMessage: 'Файл не є валідним JSON' 
      }, { status: 400 });
    }    // Extract ducats, model_count, glory_points, and other roster data
    let ducats = 0;
    let glory_points = 0;
    let model_count = 0;
    let rosterName = '';
    let catalogueName = '';

    try {
      const roster = rosterData.roster;
      
      // Extract roster name for description
      if (roster?.name && typeof roster.name === 'string') {
        rosterName = roster.name;
      }
        // Extract catalogueName (faction)
      if (roster?.catalogueName) {
        catalogueName = roster.catalogueName;
      } else if (roster?.forces?.[0]?.catalogueName) {
        catalogueName = roster.forces[0].catalogueName;
      }
      
      // Extract costs from roster.costs array
      if (roster?.costs) {
        const ducatsCost = roster.costs.find((cost: any) => cost.name === 'Ducats');
        const gloryCost = roster.costs.find((cost: any) => cost.name === 'Glory Points');
        
        if (ducatsCost) ducats = ducatsCost.value || 0;
        if (gloryCost) glory_points = gloryCost.value || 0;
      }

      // Count models recursively (same logic as warband-apply)
      function countModels(selections: any[]): number {
        if (!Array.isArray(selections)) return 0;
        let count = 0;
        for (const entry of selections) {
          if (entry.type === 'model') count += entry.number || 1;
          if (Array.isArray(entry.selections)) count += countModels(entry.selections);
        }
        return count;
      }

      if (Array.isArray(roster?.forces)) {
        model_count = roster.forces.reduce((sum: number, f: any) => sum + countModels(f.selections), 0);
      }    } catch (error) {
      console.warn('Failed to extract roster statistics:', error);
      // Continue with default values if parsing fails
    }

    // Validate roster name matches warband name
    if (rosterName && rosterName !== roster.warbands.name) {
      return NextResponse.json({ 
        userMessage: 'Назва у новому ростері не співпадає з назвою варбанди. Оновлення заборонено.' 
      }, { status: 400 });
    }

    // Validate catalogue name matches warband faction
    if (catalogueName && roster.warbands.catalogue_name && catalogueName !== roster.warbands.catalogue_name) {
      return NextResponse.json({ 
        userMessage: 'Фракція у новому ростері не співпадає з фракцією варбанди. Оновлення заборонено.' 
      }, { status: 400 });
    }    // Update the roster
    const updated = await prisma.rosters.update({
      where: { id: rosterId },
      data: {
        file_content: fileContent,
        description: rosterName || null,
        ducats: ducats,
        model_count: model_count,
        glory_points: glory_points,
        uploaded_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, roster: updated });
  } catch (error) {
    console.error('Error replacing roster:', error);
    return NextResponse.json({ 
      userMessage: 'Не вдалося замінити ростер' 
    }, { status: 500 });
  }
}
