import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { requireAuth } from '@/lib/auth';

// POST /api/campaigns/[id]/battles/plan
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Require authentication for battle planning
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaignId = parseInt(params.id);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }
    
    const user = await prisma.players.findUnique({ where: { id: authResult.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Verify user is part of this campaign
    const playerCampaign = await prisma.players_campaigns.findFirst({
      where: {
        campaign_id: campaignId,
        player_id: user.id
      }
    });

    if (!playerCampaign) {
      return NextResponse.json({ error: 'Not authorized for this campaign' }, { status: 403 });
    }

    const body = await req.json();
    const { warband_1_id, warband_2_id, warband_1_roster_id, warband_2_roster_id } = body;
    if (!warband_1_id || !warband_2_id) return NextResponse.json({ error: 'Missing warband ids' }, { status: 400 });

    // Verify warband_1 belongs to user and is in this campaign
    const myWarband = await prisma.warbands.findFirst({ 
      where: { 
        id: warband_1_id, 
        player_id: user.id,
        campaign_id: campaignId
      } 
    });
    if (!myWarband) return NextResponse.json({ error: 'Not your warband' }, { status: 403 });

    // Verify warband_2 exists, is active, and is in this campaign
    const opponentWarband = await prisma.warbands.findFirst({ 
      where: { 
        id: warband_2_id, 
        status: 'active',
        campaign_id: campaignId
      } 
    });
    if (!opponentWarband) return NextResponse.json({ error: 'Opponent warband not found or not active' }, { status: 400 });

    // Check if there's already a planned or active game for each warband in this campaign
    const existingGame1 = await prisma.games.findFirst({
      where: {
        warband_1_id,
        campaign_id: campaignId,
        status: { in: ['planned', 'active'] },
      },
    });
    const existingGame2 = await prisma.games.findFirst({
      where: {
        warband_2_id,
        campaign_id: campaignId,
        status: { in: ['planned', 'active'] },
      },
    });
    if (existingGame1 || existingGame2) {
      return NextResponse.json({
        error: 'Одна з обраних варбанд вже має заплановану або активну битву. Завершіть поточну гру або скасуйте планування, перш ніж створювати нову.'
      }, { status: 400 });
    }

    // Check if there's already a planned game for the players in this campaign
    const existingPlayerGame = await prisma.games.findFirst({
      where: {
        campaign_id: campaignId,
        OR: [
          { player1_id: user.id, status: 'planned' },
          { player2_id: user.id, status: 'planned' },
          { player1_id: opponentWarband.player_id, status: 'planned' },
          { player2_id: opponentWarband.player_id, status: 'planned' },
        ],
      },
    });
    
    if (existingPlayerGame) {
      return NextResponse.json({
        error: 'Ви або ваш опонент вже маєте заплановану гру. Гравець може мати лише одну заплановану гру одночасно.'
      }, { status: 400 });
    }

    // Determine next game number for each warband in this campaign
    async function getNextGameNumber(warbandId: number) {
      const games = await prisma.games.findMany({
        where: {
          campaign_id: campaignId,
          OR: [
            { warband_1_id: warbandId },
            { warband_2_id: warbandId },
          ],
        },
        select: {
          warband_1_gameNumber: true,
          warband_2_gameNumber: true,
        },
      });
      let maxNumber = 0;
      for (const g of games) {
        if (g.warband_1_gameNumber && g.warband_1_gameNumber > maxNumber) maxNumber = g.warband_1_gameNumber;
        if (g.warband_2_gameNumber && g.warband_2_gameNumber > maxNumber) maxNumber = g.warband_2_gameNumber;
      }
      return maxNumber + 1;
    }

    const nextGameNumber1 = await getNextGameNumber(warband_1_id);
    const nextGameNumber2 = await getNextGameNumber(warband_2_id);

    // Check for duplicate game numbers for each warband in this campaign
    const duplicateGame1 = await prisma.games.findFirst({
      where: { 
        campaign_id: campaignId,
        OR: [
          { warband_1_id: warband_1_id, warband_1_gameNumber: nextGameNumber1 },
          { warband_2_id: warband_1_id, warband_2_gameNumber: nextGameNumber1 },
        ] 
      },
    });
    const duplicateGame2 = await prisma.games.findFirst({
      where: { 
        campaign_id: campaignId,
        OR: [
          { warband_1_id: warband_2_id, warband_1_gameNumber: nextGameNumber2 },
          { warband_2_id: warband_2_id, warband_2_gameNumber: nextGameNumber2 },
        ] 
      },
    });
    if (duplicateGame1 || duplicateGame2) {
      return NextResponse.json({
        error: 'Для однієї з варбанд вже існує гра з таким номером. Неможливо створити дубль.'
      }, { status: 400 });
    }

    // Create game
    const game = await prisma.games.create({
      data: {
        warband_1_id,
        warband_2_id,
        warband_1_roster_id: warband_1_roster_id || null,
        warband_2_roster_id: warband_2_roster_id || null,
        warband_1_gameNumber: nextGameNumber1,
        warband_2_gameNumber: nextGameNumber2,
        campaign_id: campaignId,
        status: 'planned',
        player1_id: myWarband.player_id,
        player2_id: opponentWarband.player_id
      },
    });
    return NextResponse.json({ success: true, game });
  } catch (error) {
    console.error('Error creating battle plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: cancel (delete) game invitation
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Require authentication for canceling battles
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaignId = parseInt(params.id);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }
    
    const user = await prisma.players.findUnique({ where: { id: authResult.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Verify user is part of this campaign
    const playerCampaign = await prisma.players_campaigns.findFirst({
      where: {
        campaign_id: campaignId,
        player_id: user.id
      }
    });

    if (!playerCampaign) {
      return NextResponse.json({ error: 'Not authorized for this campaign' }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = Number(url.searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Verify game belongs to user and is in this campaign
    const game = await prisma.games.findFirst({ 
      where: { 
        id,
        campaign_id: campaignId
      } 
    });
    if (!game || !game.warband_1_id || !game.warband_2_id) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    
    const myWarband = await prisma.warbands.findFirst({ 
      where: { 
        id: { in: [game.warband_1_id, game.warband_2_id] }, 
        player_id: user.id,
        campaign_id: campaignId
      } 
    });
    if (!myWarband) return NextResponse.json({ error: 'Not your game' }, { status: 403 });

    // Delete game
    await prisma.games.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting battle plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
