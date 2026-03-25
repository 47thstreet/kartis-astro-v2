import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);

  const [admin, organizer, promoterUser, staff] = await Promise.all([
    prisma.user.upsert({ where: { email: 'admin@kartis.app' }, update: {}, create: { email: 'admin@kartis.app', name: 'Super Admin', role: UserRole.SUPER_ADMIN, passwordHash: hash } }),
    prisma.user.upsert({ where: { email: 'org@kartis.app' }, update: {}, create: { email: 'org@kartis.app', name: 'Organizer', role: UserRole.ORGANIZER, passwordHash: hash } }),
    prisma.user.upsert({ where: { email: 'promoter@kartis.app' }, update: {}, create: { email: 'promoter@kartis.app', name: 'Mia Promoter', role: UserRole.PROMOTER, passwordHash: hash } }),
    prisma.user.upsert({ where: { email: 'staff@kartis.app' }, update: {}, create: { email: 'staff@kartis.app', name: 'Staff', role: UserRole.STAFF, passwordHash: hash } })
  ]);

  const promoter = await prisma.promoter.upsert({
    where: { userId: promoterUser.id },
    update: {},
    create: { userId: promoterUser.id, displayName: 'Mia Promoter' }
  });

  const venue = await prisma.venue.upsert({
    where: { slug: 'nova-club-nyc' },
    update: {},
    create: {
      name: 'Nova Club',
      slug: 'nova-club-nyc',
      city: 'New York',
      address: '21 W 28th St, New York, NY',
      description: 'Immersive LED venue with VIP mezzanine'
    }
  });

  const profile = await prisma.commissionRulesProfile.create({
    data: {
      name: 'Default Tiered 20/30',
      rulesJson: [{ thresholdCents: 500000, rate: 0.2 }, { thresholdCents: null, rate: 0.3 }]
    }
  });

  const event = await prisma.event.create({
    data: {
      venueId: venue.id,
      name: 'Kartis Neon Saturdays',
      slug: `kartis-neon-saturdays-${Date.now()}`,
      description: 'Main room + rooftop set',
      startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 60 * 6),
      isPublished: true,
      capacity: 1200,
      flyerImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
      commissionRuleProfileId: profile.id
    }
  });

  const [ga, vip] = await Promise.all([
    prisma.ticketType.create({ data: { eventId: event.id, name: 'GA', description: 'General admission', priceCents: 4500, capacity: 800, saleStart: new Date(), saleEnd: event.startsAt } }),
    prisma.ticketType.create({ data: { eventId: event.id, name: 'VIP', description: 'Fast lane + balcony', priceCents: 12000, capacity: 250, saleStart: new Date(), saleEnd: event.startsAt } })
  ]);

  const layout = await prisma.venueMapLayout.create({
    data: { venueId: venue.id, eventId: event.id, name: 'Main Floor', mode: 'MANUAL', draft: false }
  });

  const zone = await prisma.venueZone.create({
    data: { layoutId: layout.id, name: 'VIP West', kind: 'VIP', x: 120, y: 140, width: 360, height: 220, color: '#7c3aed' }
  });

  const table = await prisma.venueTable.create({
    data: {
      layoutId: layout.id,
      zoneId: zone.id,
      number: 'W-12',
      tableType: 'SOFA',
      capacity: 8,
      priceCents: 220000,
      minimumSpendCents: 180000,
      x: 180,
      y: 220
    }
  });

  await prisma.tablePackage.create({
    data: {
      eventId: event.id,
      venueTableId: table.id,
      name: 'VIP Sofa W-12',
      capacity: 8,
      priceCents: 220000,
      minimumSpendCents: 180000
    }
  });

  await prisma.promoterLink.create({
    data: { eventId: event.id, promoterId: promoter.id, code: 'mia-neon-ga', ticketTypeId: ga.id }
  });

  await prisma.auditLog.create({
    data: { actorUserId: admin.id, action: 'SEED_COMPLETED', entityType: 'SYSTEM', entityId: 'bootstrap', payloadJson: { organizerId: organizer.id, staffId: staff.id, vipTicketId: vip.id } }
  });
}

main().finally(async () => prisma.$disconnect());
