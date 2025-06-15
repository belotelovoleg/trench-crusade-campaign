import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let roster_id = searchParams.get('roster_id');
  const warband_id = searchParams.get('warband_id');
  const game_number = searchParams.get('game_number');
  const format = searchParams.get('format'); // New parameter for response format

  let roster: { id: number; file_content: string | null } | null = null;
  if (warband_id && game_number) {
    roster = await prisma.rosters.findFirst({
      where: {
        warband_id: Number(warband_id),
        game_number: Number(game_number),
      },
      select: { id: true, file_content: true },
    });
    if (!roster) {
      return NextResponse.json({ error: 'Roster not found in database', code: 'not_found', reason: 'db' }, { status: 200 });
    }
  } else if (roster_id) {
    roster = await prisma.rosters.findUnique({ where: { id: Number(roster_id) }, select: { id: true, file_content: true } });
    if (!roster) {
      return NextResponse.json({ error: 'Roster not found in database', code: 'not_found', reason: 'db' }, { status: 200 });
    }
  } else {
    return NextResponse.json({ error: 'roster_id is required', code: 'bad_request', reason: 'missing_param' }, { status: 200 });
  }

  if (!roster.file_content) {
    return NextResponse.json({ error: 'Roster content missing in database', code: 'not_found', reason: 'db_file_content' }, { status: 200 });
  }

  // If format=json is requested, return JSON data instead of file download
  if (format === 'json') {
    try {
      const rosterData = JSON.parse(roster.file_content);
      return NextResponse.json({ 
        id: roster.id,
        file_content: roster.file_content,
        roster_data: rosterData 
      });
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid JSON in roster content', 
        code: 'parse_error', 
        reason: 'invalid_json' 
      }, { status: 400 });
    }
  }

  // Default behavior: return as file download (unchanged)
  const fileName = `roster_${roster.id}.json`;
  return new Response(roster.file_content, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${fileName}"`
    }
  });
}
