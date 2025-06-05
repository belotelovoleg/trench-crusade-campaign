import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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
    // Дістаємо user з cookie (login)
    const user = await prisma.players.findUnique({ where: { login: auth.value } });
    if (!user) {
      return NextResponse.json({ message: 'Користувача не знайдено.' }, { status: 401 });
    }
    // Зберігаємо файл у data/rosters
    const rostersDir = path.join(process.cwd(), 'data', 'rosters');
    await mkdir(rostersDir, { recursive: true });
    const codeName = `${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.json`;
    const filePath = path.join(rostersDir, codeName);
    await writeFile(filePath, buffer);
    // --- Додаємо підтримку оновлення ростеру для існуючої варбанди ---
    const warbandIdParam = req.url.match(/warband_id=(\d+)/)?.[1];
    if (warbandIdParam) {
      const warband = await prisma.warbands.findUnique({ where: { id: Number(warbandIdParam), player_id: user.id } });
      if (!warband) {
        return NextResponse.json({ message: 'Варбанди не знайдено або не належить вам.' }, { status: 400 });
      }
      // Витягуємо catalogueName
      let catalogueName = json?.roster?.catalogueName || null;
      if (!catalogueName && Array.isArray(json?.roster?.forces) && json.roster.forces[0]?.catalogueName) {
        catalogueName = json.roster.forces[0].catalogueName;
      }
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
      // Визначаємо наступний номер гри для цієї варбанди
      const lastRoster = await prisma.rosters.findFirst({
        where: { warband_id: warband.id },
        orderBy: { game_number: 'desc' },
      });
      const nextGameNumber = lastRoster && typeof lastRoster.game_number === 'number' ? lastRoster.game_number + 1 : 1;
      const createdRoster = await prisma.rosters.create({
        data: {
          warband_id: warband.id,
          file_url: `/rosters/${codeName}`,
          description: json.description || null,
          ducats: ducats,
          glory_points: glory_points,
          model_count: model_count,
          game_number: nextGameNumber,
        },
      });
      // Оновлюємо статус варбанди на 'checking'
      await prisma.warbands.update({ where: { id: warband.id }, data: { status: 'checking' } });
      return NextResponse.json({ 
        message: 'Оновлений ростер завантажено та відправлено на перевірку!',
        file_url: createdRoster.id ? `/api/roster?roster_id=${createdRoster.id}` : null
      });
    }
    // --- Якщо warbandIdParam не передано, створюємо нову варбанду як раніше ---
    if (!warbandIdParam) {
      // name тепер у json.roster.name
      const warbandName = json?.roster?.name;
      if (!warbandName || typeof warbandName !== 'string') {
        return NextResponse.json({ message: 'У JSON відсутнє поле roster.name.' }, { status: 400 });
      }
      // Чи вже є warband з таким name
      const existing = await prisma.warbands.findFirst({ where: { player_id: user.id, name: warbandName } });
      if (existing) {
        return NextResponse.json({ message: 'У вас вже є warband з такою назвою.' }, { status: 400 });
      }
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
      // --- Додаємо game_number для ростера ---
      // Визначаємо наступний номер гри для цієї варбанди
      const lastRoster = await prisma.rosters.findFirst({
        where: { warband_id: warband.id },
        orderBy: { game_number: 'desc' },
      });
      const nextGameNumber = lastRoster && typeof lastRoster.game_number === 'number' ? lastRoster.game_number + 1 : 1;
      const createdRoster = await prisma.rosters.create({
        data: {
          warband_id: warband.id,
          file_url: `/rosters/${codeName}`,
          description: json.description || null,
          ducats: ducats,
          glory_points: glory_points,
          model_count: model_count,
          game_number: nextGameNumber,
        },
      });
      // Після створення ростера, у відповіді API формуємо file_url як /api/roster?roster_id=ID
      return NextResponse.json({ 
        message: 'Ростер завантажено та відправлено на валідацію!',
        file_url: createdRoster.id ? `/api/roster?roster_id=${createdRoster.id}` : null
      });
    }
  } catch (e: any) {
    return NextResponse.json({ message: 'Помилка сервера: ' + (e?.message || '') }, { status: 500 });
  }
}
