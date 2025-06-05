import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let roster_id = searchParams.get('roster_id');
  const warband_id = searchParams.get('warband_id');
  const game_number = searchParams.get('game_number');

  // Якщо передано warband_id та game_number — шукаємо потрібний ростер у БД
  if (warband_id && game_number) {
    const roster = await prisma.rosters.findFirst({
      where: {
        warband_id: Number(warband_id),
        game_number: Number(game_number),
      },
    });
    if (!roster || !roster.file_url) {
      return NextResponse.json({ error: 'Roster not found' }, { status: 404 });
    }
    roster_id = roster.file_url.replace(/^.*\/(.+)\.json$/, '$1');
  }

  // Якщо передано roster_id — шукаємо запис у БД, дістаємо file_url
  if (roster_id && !warband_id && !game_number) {
    const rosterDb = await prisma.rosters.findUnique({ where: { id: Number(roster_id) } });
    if (!rosterDb || !rosterDb.file_url) {
      return NextResponse.json({ error: 'Roster not found' }, { status: 404 });
    }
    roster_id = rosterDb.file_url.replace(/^.*\/(.+)\.json$/, '$1');
  }

  if (!roster_id) {
    return NextResponse.json({ error: 'roster_id is required' }, { status: 400 });
  }
  // Дозволяємо roster_id з .json або без
  roster_id = roster_id.replace(/\.json$/i, '');
  try {
    // Пошук точного імені файлу у data/rosters
    const rostersDir = path.join(process.cwd(), 'data', 'rosters');
    const files = await fs.readdir(rostersDir);
    const fileName = files.find(f => f === `${roster_id}.json` || f === roster_id);
    if (!fileName) throw new Error('Not found');
    const rosterPath = path.join(rostersDir, fileName);
    const data = await fs.readFile(rosterPath);
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  } catch (e) {
    return NextResponse.json({ error: 'Roster not found' }, { status: 404 });
  }
}
