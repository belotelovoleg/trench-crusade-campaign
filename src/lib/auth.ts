import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  userId: number;
  login: string;
  name: string;
  email: string;
  is_super_admin: boolean;
}

/**
 * Verify JWT token and return user data or null if invalid/missing
 */
export async function verifyAuth(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken')?.value;
    
    if (!authToken) {
      console.log("No auth token found in cookies");
      return null;
    }

    const decoded = jwt.verify(authToken, JWT_SECRET) as any;
    console.log("JWT token decoded:", decoded);
    
    if (!decoded.userId) {
      console.log("No userId in decoded JWT");
      return null;
    }

    return {
      userId: decoded.userId,
      login: decoded.login,
      name: decoded.name,
      email: decoded.email,
      is_super_admin: decoded.is_super_admin,
    };
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}

/**
 * Middleware to require authentication - returns error response if not authenticated
 */
export async function requireAuth(): Promise<AuthUser | NextResponse> {
  const user = await verifyAuth();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Потрібна аутентифікація' },
      { status: 401 }
    );
  }
  
  return user;
}

/**
 * Middleware to require super admin privileges
 */
export async function requireSuperAdmin(): Promise<AuthUser | NextResponse> {
  const authResult = await requireAuth();
  
  console.log("Auth result in requireSuperAdmin:", 
    authResult instanceof NextResponse ? 
      "NextResponse with status " + authResult.status : 
      "User with is_super_admin=" + authResult.is_super_admin);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Return the auth error
  }
  
  if (!authResult.is_super_admin) {
    console.log("User failed super admin check:", authResult);
    return NextResponse.json(
      { error: 'Потрібні права супер-адміністратора' },
      { status: 403 }
    );
  }
  
  return authResult;
}
