'use server';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth();
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'User is not authenticated'
      });
    }
    
    return NextResponse.json({
      authenticated: true,
      userId: user.userId,
      login: user.login,
      name: user.name,
      email: user.email,
      is_super_admin: user.is_super_admin,
      message: user.is_super_admin ? 'User has super admin privileges' : 'User does not have super admin privileges'
    });
  } catch (error) {
    console.error('Error in check-super-admin:', error);
    return NextResponse.json({ error: 'Server error checking admin status' }, { status: 500 });
  }
}
