import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roster_id = searchParams.get('roster_id');
  if (!roster_id) {
    return NextResponse.json({ error: 'roster_id is required' }, { status: 400 });
  }
  try {
    // Ростери зберігаються у public/rosters/{roster_id}.json
    const rosterPath = path.join(process.cwd(), 'public', 'rosters', `${roster_id}.json`);
    const data = await fs.readFile(rosterPath, 'utf-8');
    const roster = JSON.parse(data);
    return NextResponse.json({ roster });
  } catch (e) {
    return NextResponse.json({ error: 'Roster not found' }, { status: 404 });
  }
}
