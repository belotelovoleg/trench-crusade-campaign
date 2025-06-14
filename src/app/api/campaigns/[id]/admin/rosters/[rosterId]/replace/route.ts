import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string, rosterId: string } }) {
  try {
    const campaignId = parseInt(params.id);
    const rosterId = parseInt(params.rosterId);
    
    if (!campaignId || !rosterId) {
      return NextResponse.json({ error: 'Invalid campaign or roster ID' }, { status: 400 });
    }    // Require authentication and campaign admin rights
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;
    
    // Check if user is admin of this campaign
    const playerCampaign = await prisma.players_campaigns.findUnique({
      where: {
        player_id_campaign_id: {
          player_id: user.userId,
          campaign_id: campaignId,
        },
      },
    });

    if (!playerCampaign?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    const arrayBuffer = await (file as Blob).arrayBuffer();
    const jsonString = Buffer.from(arrayBuffer).toString('utf-8');
    let jsonContent;
    try {
      jsonContent = JSON.parse(jsonString);
    } catch {
      // Show a more user-friendly error message for invalid JSON
      return NextResponse.json({ 
        error: 'Файл не є валідним JSON. Перевірте, чи ви експортували файл з New Recruit як JSON.', 
        userMessage: 'Файл не є валідним JSON. Перевірте, чи ви експортували файл з New Recruit як JSON.' 
      }, { status: 400 });
    }

    // Fetch the roster and its warband to check campaign match and catalogue_name
    const roster = await prisma.rosters.findUnique({ 
      where: { id: rosterId }, 
      include: { 
        warbands: {
          include: {
            campaigns: true
          }
        }
      } 
    });
    
    if (!roster) {
      return NextResponse.json({ error: 'Roster not found' }, { status: 404 });
    }

    // Verify roster belongs to the specified campaign
    if (roster.warbands.campaign_id !== campaignId) {
      return NextResponse.json({ error: 'Roster does not belong to this campaign' }, { status: 403 });
    }

    // Extract catalogueName from JSON
    let catalogueName = jsonContent?.roster?.catalogueName || null;
    if (!catalogueName && Array.isArray(jsonContent?.roster?.forces) && jsonContent.roster.forces[0]?.catalogueName) {
      catalogueName = jsonContent.roster.forces[0].catalogueName;
    }
    
    if (catalogueName && roster.warbands.catalogue_name && catalogueName !== roster.warbands.catalogue_name) {
      return NextResponse.json({ 
        error: 'Фракція у новому ростері не співпадає з фракцією варбанди. Оновлення заборонено.', 
        userMessage: 'Фракція у новому ростері не співпадає з фракцією варбанди. Оновлення заборонено.' 
      }, { status: 400 });
    }

    // Extract ducats, glory points, and model count from JSON (same as /api/warband-apply)
    let ducats = 0;
    let glory_points = 0;
    let model_count = 0;
    if (Array.isArray(jsonContent?.roster?.costs)) {
      const ducatsObj = jsonContent.roster.costs.find((c: any) => c.name === 'Ducats');
      if (ducatsObj && typeof ducatsObj.value === 'number') ducats = ducatsObj.value;
      const gloryObj = jsonContent.roster.costs.find((c: any) => c.name === 'Glory Points');
      if (gloryObj && typeof gloryObj.value === 'number') glory_points = gloryObj.value;
    }
    function countModels(selections: any[]): number {
      if (!Array.isArray(selections)) return 0;
      let count = 0;
      for (const entry of selections) {
        if (entry.type === 'model') count += entry.number || 1;
        if (Array.isArray(entry.selections)) count += countModels(entry.selections);
      }
      return count;
    }
    if (Array.isArray(jsonContent?.roster?.forces)) {
      model_count = jsonContent.roster.forces.reduce((sum: number, f: any) => sum + countModels(f.selections), 0);
    }

    // Update the roster in DB with extracted values
    const updated = await prisma.rosters.update({
      where: { id: rosterId },
      data: {
        file_content: jsonString,
        ducats,
        glory_points,
        model_count,
      },
    });
    
    return NextResponse.json({ success: true, roster: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
  }
}
