import { prisma } from './prisma';

export interface CmsEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  description: string;
  image: string;
  imageUrl?: string;
  source: string;
  ticketUrl?: string;
  priceCents?: number;
  featured: boolean;
  partners: string[];
  price?: string;
  ageRestriction?: string;
  dressCode?: string;
}

export async function readEvents(): Promise<CmsEvent[]> {
  const rows = await prisma.cmsEvent.findMany({ orderBy: { date: 'asc' } });
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    date: r.date,
    time: r.time,
    venue: r.venue,
    location: r.location,
    description: r.description,
    image: r.image,
    imageUrl: r.imageUrl ?? undefined,
    source: r.source,
    ticketUrl: r.ticketUrl ?? undefined,
    priceCents: r.priceCents,
    featured: r.featured,
    partners: r.partners,
    price: r.price ?? undefined,
    ageRestriction: r.ageRestriction ?? undefined,
    dressCode: r.dressCode ?? undefined,
  }));
}

export async function createEvent(data: Omit<CmsEvent, 'id'>): Promise<CmsEvent> {
  const row = await prisma.cmsEvent.create({
    data: {
      name: data.name,
      date: data.date,
      time: data.time ?? '',
      venue: data.venue ?? '',
      location: data.location ?? '',
      description: data.description ?? '',
      image: data.image ?? '',
      imageUrl: data.imageUrl || null,
      source: data.source ?? 'vibe',
      ticketUrl: data.ticketUrl || null,
      priceCents: data.priceCents ?? 0,
      featured: data.featured ?? false,
      partners: data.partners ?? [],
      price: data.price || null,
      ageRestriction: data.ageRestriction || null,
      dressCode: data.dressCode || null,
    },
  });
  return { ...row, imageUrl: row.imageUrl ?? undefined, ticketUrl: row.ticketUrl ?? undefined, price: row.price ?? undefined, ageRestriction: row.ageRestriction ?? undefined, dressCode: row.dressCode ?? undefined };
}

export async function updateEvent(id: string, data: Partial<CmsEvent>): Promise<boolean> {
  const exists = await prisma.cmsEvent.findUnique({ where: { id } });
  if (!exists) return false;
  await prisma.cmsEvent.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.date !== undefined && { date: data.date }),
      ...(data.time !== undefined && { time: data.time }),
      ...(data.venue !== undefined && { venue: data.venue }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.image !== undefined && { image: data.image }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
      ...(data.source !== undefined && { source: data.source }),
      ...(data.ticketUrl !== undefined && { ticketUrl: data.ticketUrl || null }),
      ...(data.priceCents !== undefined && { priceCents: data.priceCents }),
      ...(data.featured !== undefined && { featured: data.featured }),
      ...(data.partners !== undefined && { partners: data.partners }),
      ...(data.price !== undefined && { price: data.price || null }),
      ...(data.ageRestriction !== undefined && { ageRestriction: data.ageRestriction || null }),
      ...(data.dressCode !== undefined && { dressCode: data.dressCode || null }),
    },
  });
  return true;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const exists = await prisma.cmsEvent.findUnique({ where: { id } });
  if (!exists) return false;
  await prisma.cmsEvent.delete({ where: { id } });
  return true;
}
