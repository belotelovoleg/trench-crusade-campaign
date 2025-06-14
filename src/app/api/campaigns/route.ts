import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperAdmin } from '@/lib/auth';

export async function GET() {
  // Require authentication to view campaigns
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const campaigns = await prisma.campaigns.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            players_campaigns: true,
            warbands: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Require super admin privileges to create campaigns
  console.log("Checking super admin status for campaign creation");
  const authResult = await requireSuperAdmin();
  if (authResult instanceof NextResponse) {
    console.log("Super admin check failed:", authResult.status);
    return authResult;
  }
  console.log("Super admin check passed for user:", authResult.userId, "is_super_admin:", authResult.is_super_admin);

  try {
    // Check content type to determine how to parse the request
    const contentType = request.headers.get('content-type') || '';
    
    let name: string;
    let description: string | null = null;
    let imageBase64: string | null = null;
    
    if (contentType.includes('application/json')) {
      // Handle JSON request
      const json = await request.json();
      name = json.name;
      description = json.description || null;
      // No image handling for JSON requests
    } else if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data (for image uploads)
      const formData = await request.formData();
      name = formData.get('name') as string;
      description = formData.get('description') as string || null;
      
      const imageFile = formData.get('image') as File;
      if (imageFile && imageFile.size > 0) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        imageBase64 = `data:${imageFile.type};base64,${buffer.toString('base64')}`;
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported content type. Use application/json or multipart/form-data' },
        { status: 400 }
      );
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }    // Create the campaign
    const campaign = await prisma.campaigns.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        image: imageBase64,
      },
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
