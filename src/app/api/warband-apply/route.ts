import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const auth = cookieStore.get('auth');
    if (!auth?.value) {
      return NextResponse.json({ message: 'Необхідно увійти.' }, { status: 401 });
    }
    // Only accept multipart/form-data
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ message: 'Очікується файл (multipart/form-data)' }, { status: 400 });
    }
    // Parse formData
    const formData = await req.formData();
    const file = formData.get('roster');
    if (!file || typeof file === 'string' || !('arrayBuffer' in file)) {
      return NextResponse.json({ message: 'Файл не знайдено.' }, { status: 400 });
    }
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      return NextResponse.json({ message: 'Можна завантажити лише JSON-файл.' }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    let json;
    try {
      json = JSON.parse(buffer.toString('utf-8'));
    } catch {
      return NextResponse.json({ message: 'Файл не є валідним JSON.' }, { status: 400 });
    }
    // name тепер у json.roster.name
    const warbandName = json?.roster?.name;
    if (!warbandName || typeof warbandName !== 'string') {
      return NextResponse.json({ message: 'У JSON відсутнє поле roster.name.' }, { status: 400 });
    }
    // Дістаємо user з cookie (login)
    const user = await prisma.players.findUnique({ where: { login: auth.value } });
    if (!user) {
      return NextResponse.json({ message: 'Користувача не знайдено.' }, { status: 401 });
    }
    // Чи вже є warband з таким name
    const existing = await prisma.warbands.findFirst({ where: { player_id: user.id, name: warbandName } });
    if (existing) {
      return NextResponse.json({ message: 'У вас вже є warband з такою назвою.' }, { status: 400 });
    }
    // Зберігаємо файл у public/rosters
    const rostersDir = path.join(process.cwd(), 'public', 'rosters');
    await mkdir(rostersDir, { recursive: true });
    const codeName = `${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.json`;
    const filePath = path.join(rostersDir, codeName);
    await writeFile(filePath, buffer);
    // Витягуємо catalogueName
    let catalogueName = json?.roster?.catalogueName || null;
    if (!catalogueName && Array.isArray(json?.roster?.forces) && json.roster.forces[0]?.catalogueName) {
      catalogueName = json.roster.forces[0].catalogueName;
    }
    // Додаємо warband
    const warband = await prisma.warbands.create({
      data: {
        player_id: user.id,
        name: warbandName,
        catalogue_name: catalogueName,
      },
    });
    // Додаємо запис до rosters
    // Витягуємо кількість дукатів, glory points і моделей з JSON (costs)
    let ducats = 0;
    let glory_points = 0;
    let model_count = 0;
    if (Array.isArray(json?.roster?.costs)) {
      const ducatsObj = json.roster.costs.find((c: any) => c.name === 'Ducats');
      if (ducatsObj && typeof ducatsObj.value === 'number') ducats = ducatsObj.value;
      const gloryObj = json.roster.costs.find((c: any) => c.name === 'Glory Points');
      if (gloryObj && typeof gloryObj.value === 'number') glory_points = gloryObj.value;
    }
    // Підрахунок моделей (рекурсивно)
    function countModels(selections: any[]): number {
      if (!Array.isArray(selections)) return 0;
      let count = 0;
      for (const entry of selections) {
        if (entry.type === 'model') count += entry.number || 1;
        if (Array.isArray(entry.selections)) count += countModels(entry.selections);
      }
      return count;
    }
    if (Array.isArray(json?.roster?.forces)) {
      model_count = json.roster.forces.reduce((sum: number, f: any) => sum + countModels(f.selections), 0);
    }
    await prisma.rosters.create({
      data: {
        warband_id: warband.id,
        file_url: `/rosters/${codeName}`,
        description: json.description || null,
        ducats,
        glory_points,
        model_count,
      },
    });
    return NextResponse.json({ message: 'Ростер завантажено та відправлено на валідацію!' });
  } catch (e: any) {
    return NextResponse.json({ message: 'Помилка сервера: ' + (e?.message || '') }, { status: 500 });
  }
}
