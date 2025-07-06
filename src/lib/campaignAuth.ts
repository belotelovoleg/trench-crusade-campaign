import { NextResponse } from 'next/server';
import { verifyAuth } from './auth';
import prisma from './prisma';

/**
 * Middleware to require campaign admin privileges
 */
export async function requireCampaignAdmin(campaignId: number): Promise<any | NextResponse> {
  const user = await verifyAuth();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Потрібна аутентифікація' },
      { status: 401 }
    );
  }
  
  // Check if user is super admin (can access any campaign)
  if (user.is_super_admin) {
    return user;
  }
  
  // Check if user is admin of this specific campaign
  const campaignMembership = await prisma.players_campaigns.findFirst({
    where: {
      player_id: user.userId,
      campaign_id: campaignId,
      is_admin: true
    }
  });
  
  if (!campaignMembership) {
    return NextResponse.json(
      { error: 'Потрібні права адміністратора кампанії' },
      { status: 403 }
    );
  }
  
  return user;
}

/**
 * Middleware to require campaign membership (user or admin)
 */
export async function requireCampaignMembership(campaignId: number): Promise<any | NextResponse> {
  const user = await verifyAuth();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Потрібна аутентифікація' },
      { status: 401 }
    );
  }
  
  // Check if user is super admin (can access any campaign)
  if (user.is_super_admin) {
    return user;
  }
  
  // Check if user is member of this campaign
  const campaignMembership = await prisma.players_campaigns.findFirst({
    where: {
      player_id: user.userId,
      campaign_id: campaignId
    }
  });
  
  if (!campaignMembership) {
    return NextResponse.json(
      { error: 'Потрібне членство в кампанії' },
      { status: 403 }
    );
  }
  
  return { ...user, is_campaign_admin: campaignMembership.is_admin };
}
