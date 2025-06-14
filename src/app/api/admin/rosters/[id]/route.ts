import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

// GET /api/admin/rosters/[id]
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('auth');
  if (!auth?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.players.findUnique({ where: { login: auth.value } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const roster = await prisma.rosters.findUnique({
      where: { id },
      select: {
        id: true,
        warband_id: true,
        file_content: true,
        description: true,
        game_number: true,
      }
    });

    if (!roster) return NextResponse.json({ error: 'Roster not found' }, { status: 404 });

    return NextResponse.json(roster);
  } catch (error) {
    console.error('Error fetching roster:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
