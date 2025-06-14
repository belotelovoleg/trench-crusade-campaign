import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken')?.value;
    
    if (!authToken) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Verify and decode JWT token
    const decoded = jwt.verify(authToken, JWT_SECRET) as any;
    const userId = decoded.userId;

    if (!userId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Get campaign ID from query params if provided
    const url = new URL(request.url);
    const campaignId = url.searchParams.get('campaignId');

    // Find user by ID from JWT token
    const user = await prisma.players.findUnique({
      where: { id: userId },select: { 
        id: true, 
        login: true, 
        name: true, 
        email: true, 
        is_super_admin: true, 
        avatar_url: true,
        notes: true
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }    // If campaignId is provided, check campaign-specific admin status and membership
    let isCampaignAdmin = false; // default to not admin
    let isInCampaign = false; // default to not in campaign
    let currentCampaign: any = null; // user's current campaign
    
    if (campaignId) {
      const campaignMembership = await prisma.players_campaigns.findFirst({
        where: {
          player_id: user.id,
          campaign_id: parseInt(campaignId)
        },
        select: {
          is_admin: true
        }
      });
      if (campaignMembership) {
        isInCampaign = true;
        isCampaignAdmin = campaignMembership.is_admin;
      }
    } else {
      // If no specific campaign requested, check if user is in any campaign
      const userCampaign = await prisma.players_campaigns.findFirst({
        where: {
          player_id: user.id
        },
        include: {
          campaigns: {
            select: {
              id: true,
              name: true,
              description: true,
            }
          }
        }
      });
      
      if (userCampaign) {
        currentCampaign = userCampaign.campaigns;
        isCampaignAdmin = userCampaign.is_admin;
      }
    }

    // Get warbands (filter by campaign if specified)
    const warbandsWhere = campaignId ? { 
      player_id: user.id,
      campaign_id: parseInt(campaignId)
    } : { 
      player_id: user.id 
    };
    
    const warbands = await prisma.warbands.findMany({
      where: warbandsWhere,
      select: {
        id: true,
        name: true,
        status: true,
        rosters: {
          orderBy: { uploaded_at: 'desc' },
          take: 1,
          select: { id: true, file_url: true },
        },
      },
    });

    // Format warbands with file URLs
    const warbandsWithFile = warbands.map(w => ({
      id: w.id,
      name: w.name,
      status: w.status,
      file_url: w.rosters[0]?.id ? `/api/roster?roster_id=${w.rosters[0].id}` : null,
    }));

    return NextResponse.json({
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        email: user.email,        is_admin: isCampaignAdmin, // Use campaign-specific admin status
        is_in_campaign: isInCampaign, // Whether user is in this campaign
        current_campaign: currentCampaign, // User's current campaign (if any)
        is_super_admin: user.is_super_admin,
        avatar: user.avatar_url ? `/${user.avatar_url}` : null,
        hasWarband: warbandsWithFile.length > 0,
        warbandCount: warbandsWithFile.length,
        warbands: warbandsWithFile,
      },
    });
  } catch (error) {
    console.error('Error in /api/me:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
