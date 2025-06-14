import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Require authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

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
    }

    // Check if campaign exists
    const campaign = await prisma.campaigns.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }const formData = await request.formData();
    const rosterFile = formData.get('roster') as File;
    const warbandIdStr = formData.get('warband_id') as string;
    const warbandId = warbandIdStr ? parseInt(warbandIdStr) : null;

    if (!rosterFile) {
      return NextResponse.json({ error: 'No roster file provided' }, { status: 400 });
    }

    // Read and parse the JSON roster
    const rosterText = await rosterFile.text();
    let rosterData;
    try {
      rosterData = JSON.parse(rosterText);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 });
    }    // Validate roster - BattleScribe format
    const roster = rosterData.roster;
    if (!roster) {
      return NextResponse.json({ error: 'Invalid roster format - missing roster' }, { status: 400 });
    }

    // Get warband name from roster.name
    const warbandName = roster.name;
    if (!warbandName || typeof warbandName !== 'string') {
      return NextResponse.json({ error: 'Invalid roster format - missing roster.name' }, { status: 400 });
    }

    // Extract catalogueName (faction)
    let catalogueName = roster.catalogueName || null;
    if (!catalogueName && Array.isArray(roster.forces) && roster.forces[0]?.catalogueName) {
      catalogueName = roster.forces[0].catalogueName;
    }

    // Extract costs (ducats and glory points)
    let ducats = 0;
    let glory_points = 0;
    if (Array.isArray(roster.costs)) {
      const ducatsObj = roster.costs.find((c: any) => c.name === 'Ducats');
      if (ducatsObj && typeof ducatsObj.value === 'number') ducats = ducatsObj.value;
      
      const gloryObj = roster.costs.find((c: any) => c.name === 'Glory Points');
      if (gloryObj && typeof gloryObj.value === 'number') glory_points = gloryObj.value;
    }

    // Count models recursively
    function countModels(selections: any[]): number {
      if (!Array.isArray(selections)) return 0;
      let count = 0;
      for (const entry of selections) {
        if (entry.type === 'model') count += entry.number || 1;
        if (Array.isArray(entry.selections)) count += countModels(entry.selections);
      }
      return count;
    }

    let modelCount = 0;
    if (Array.isArray(roster.forces)) {
      modelCount = roster.forces.reduce((sum: number, f: any) => sum + countModels(f.selections), 0);
    }

    // Handle updating existing warband or creating a new one
    if (warbandId) {      // Update existing warband
      const warband = await prisma.warbands.findUnique({
        where: { id: warbandId }
      });

      if (!warband) {
        return NextResponse.json({ error: 'Warband not found' }, { status: 404 });
      }      if (warband.player_id !== authResult.userId) {
        return NextResponse.json({ error: 'You do not own this warband' }, { status: 403 });
      }

      if (warband.campaign_id !== campaignId) {
        return NextResponse.json({ error: 'Warband does not belong to this campaign' }, { status: 400 });
      }

      // Get current roster count for game number
      const rosterCount = await prisma.rosters.count({
        where: { warband_id: warbandId }
      });
        // Create a new roster for the warband
      const gameNumber = rosterCount + 1;
      await prisma.rosters.create({
        data: {
          warband_id: warbandId,
          game_number: gameNumber,
          model_count: modelCount,
          ducats: ducats,
          glory_points: glory_points,
          file_content: rosterText
        }
      });

      // Update warband status to "checking"
      await prisma.warbands.update({
        where: { id: warbandId },
        data: { status: 'checking' }
      });

      return NextResponse.json({
        message: 'Ростер успішно оновлено і відправлено на перевірку',
        success: true
      });    } else {
      // Create a new warband
        // Check if warband with this name already exists for this player in this campaign
      const existingWarband = await prisma.warbands.findFirst({
        where: {
          player_id: authResult.userId,
          campaign_id: campaignId,
          name: warbandName
        }
      });

      if (existingWarband) {
        return NextResponse.json({ error: 'У вас вже є варбанда з такою назвою в цій кампанії' }, { status: 400 });
      }

      const newWarband = await prisma.warbands.create({
        data: {
          name: warbandName,
          catalogue_name: catalogueName,
          player_id: authResult.userId,
          campaign_id: campaignId,
          status: 'checking'
        }
      });

      // Create initial roster
      await prisma.rosters.create({
        data: {
          warband_id: newWarband.id,
          game_number: 1,
          model_count: modelCount,
          ducats: ducats,
          glory_points: glory_points,
          file_content: rosterText
        }
      });

      return NextResponse.json({
        message: 'Нову варбанду успішно створено і відправлено на перевірку',
        success: true,
        warband_id: newWarband.id
      });
    }
  } catch (error: any) {
    console.error('Error in warband-apply API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
