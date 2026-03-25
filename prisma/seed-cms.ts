import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(process.cwd(), 'data', 'events.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('No data/events.json found, skipping seed.');
    return;
  }

  const events = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`Seeding ${events.length} CMS events...`);

  for (const e of events) {
    await prisma.cmsEvent.upsert({
      where: { id: e.id },
      update: {},
      create: {
        id: e.id,
        name: e.name,
        date: e.date,
        time: e.time ?? '',
        venue: e.venue ?? '',
        location: e.location ?? '',
        description: e.description ?? '',
        image: e.image ?? '',
        imageUrl: e.imageUrl || null,
        source: e.source ?? 'vibe',
        ticketUrl: e.ticketUrl || null,
        priceCents: e.priceCents ?? 0,
        featured: e.featured ?? false,
        partners: e.partners ?? [],
        price: e.price || null,
        ageRestriction: e.ageRestriction || null,
        dressCode: e.dressCode || null,
      },
    });
  }

  console.log('Done.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
