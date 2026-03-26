import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

function pad(n: number) { return n.toString().padStart(2, '0'); }

function toICSDate(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: { venue: true },
  });

  if (!event) {
    return new Response('Event not found', { status: 404 });
  }

  const location = [event.venue.name, event.venue.address, event.venue.city]
    .filter(Boolean)
    .join(', ');

  const description = event.description
    ? escapeICS(event.description.slice(0, 500))
    : '';

  const uid = `${event.id}@kartis`;
  const now = toICSDate(new Date());

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kartis//Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toICSDate(event.startsAt)}`,
    `DTEND:${toICSDate(event.endsAt)}`,
    `SUMMARY:${escapeICS(event.name)}`,
    `LOCATION:${escapeICS(location)}`,
    `DESCRIPTION:${description}`,
    `URL:https://kartis-astro.vercel.app/en/event/${event.id}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.name.replace(/[^a-zA-Z0-9 ]/g, '').trim()}.ics"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
