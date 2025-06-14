import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const user = await prisma.players.findUnique({
      where: { id: authResult.userId },
      select: {
        id: true,
        login: true,
        name: true,
        email: true,
        avatar_url: true,
        notes: true,
        is_super_admin: true,
        is_active: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Handle multipart form data (avatar upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const avatarFile = formData.get('avatar') as File;
      
      if (!avatarFile) {
        return NextResponse.json({ error: 'No avatar file provided' }, { status: 400 });
      }
      
      // Process avatar file
      const arrayBuffer = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const avatarBase64 = `data:${avatarFile.type};base64,${buffer.toString('base64')}`;
      
      // Generate a unique filename
      const timestamp = Date.now();
      const filename = `avatar_${authResult.userId}_${timestamp}`;
      const avatar_url = filename;
      
      // Update user with new avatar
      await prisma.players.update({
        where: { id: authResult.userId },
        data: { 
          avatar: avatarBase64,
          avatar_url: avatar_url
        },
      });
      
      return NextResponse.json({ success: true, avatar_url });
    }
    
    // Handle JSON data
    if (contentType.includes('application/json')) {
      const data = await request.json();
      const updateData: any = {};
      
      // Update email if provided
      if (data.email) {
        // Check if email is already in use by another user
        const existingUser = await prisma.players.findFirst({
          where: {
            email: data.email,
            id: { not: authResult.userId }
          }
        });
        
        if (existingUser) {
          return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
        }
        
        updateData.email = data.email;
      }
      
      // Update password if provided
      if (data.password && data.newPassword) {
        // Get current password hash
        const user = await prisma.players.findUnique({
          where: { id: authResult.userId },
          select: { password_hash: true }
        });
        
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        // Verify current password
        const isMatch = await bcrypt.compare(data.password, user.password_hash);
        if (!isMatch) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }
        
        // Hash new password
        const newPasswordHash = await bcrypt.hash(data.newPassword, 10);
        updateData.password_hash = newPasswordHash;
      }
      
      // Update notes if provided
      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }
      
      // Update user
      if (Object.keys(updateData).length > 0) {
        await prisma.players.update({
          where: { id: authResult.userId },
          data: updateData
        });
      }
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
