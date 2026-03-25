import { z } from 'zod';

export const venueCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(1),
  description: z.string().min(1)
});

export const venueUpdateSchema = venueCreateSchema.partial().refine(v => Object.keys(v).length > 0, {
  message: 'At least one field is required'
});

export const eventCreateSchema = z.object({
  venueId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  isPublished: z.boolean().optional(),
  capacity: z.coerce.number().int().positive(),
  currency: z.string().min(3).max(3).optional(),
  commissionRuleProfileId: z.string().min(1).nullable().optional()
});

export const eventUpdateSchema = eventCreateSchema.partial().refine(v => Object.keys(v).length > 0, {
  message: 'At least one field is required'
});

export const ticketTypeCreateSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  priceCents: z.coerce.number().int().nonnegative(),
  capacity: z.coerce.number().int().positive(),
  saleStart: z.coerce.date(),
  saleEnd: z.coerce.date()
});

export const ticketTypeUpdateSchema = ticketTypeCreateSchema.partial().refine(v => Object.keys(v).length > 0, {
  message: 'At least one field is required'
});

export const tablePackageCreateSchema = z.object({
  eventId: z.string().min(1),
  venueTableId: z.string().min(1).nullable().optional(),
  name: z.string().min(1),
  capacity: z.coerce.number().int().positive(),
  priceCents: z.coerce.number().int().nonnegative(),
  minimumSpendCents: z.coerce.number().int().nonnegative()
});

export const tablePackageUpdateSchema = tablePackageCreateSchema.partial().refine(v => Object.keys(v).length > 0, {
  message: 'At least one field is required'
});

const zoneSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  kind: z.string().min(1).optional(),
  x: z.coerce.number(),
  y: z.coerce.number(),
  width: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  color: z.string().min(1).optional()
});

const tableSchema = z.object({
  id: z.string().min(1).optional(),
  zoneId: z.string().min(1).nullable().optional(),
  number: z.string().min(1),
  tableType: z.string().min(1).optional(),
  capacity: z.coerce.number().int().positive().optional(),
  priceCents: z.coerce.number().int().nonnegative().optional(),
  minimumSpendCents: z.coerce.number().int().nonnegative().optional(),
  x: z.coerce.number(),
  y: z.coerce.number(),
  status: z.enum(['AVAILABLE', 'HELD', 'RESERVED', 'BLOCKED']).optional()
});

export const mapLayoutSaveSchema = z.object({
  layoutId: z.string().min(1),
  mode: z.string().optional(),
  floorPlanImage: z.string().nullable().optional(),
  zones: z.array(zoneSchema).optional(),
  tables: z.array(tableSchema).optional()
});

export const tableActionSchema = z.object({
  tableId: z.string().min(1),
  eventId: z.string().min(1)
});

export const tableReserveSchema = tableActionSchema.extend({
  orderId: z.string().min(1)
});

const checkoutTicketSchema = z.object({
  ticketTypeId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  attendeeName: z.string().optional(),
  attendeeEmail: z.string().email().optional()
});

const checkoutTableSchema = z.object({
  tablePackageId: z.string().min(1),
  quantity: z.coerce.number().int().positive()
});

export const createCheckoutSessionSchema = z.object({
  eventId: z.string().min(1),
  email: z.string().email(),
  locale: z.string().min(2).max(5).optional(),
  tickets: z.array(checkoutTicketSchema).optional().default([]),
  tables: z.array(checkoutTableSchema).optional().default([]),
  promoterCode: z.string().optional()
});

export const promoterLinkCreateSchema = z.object({
  eventId: z.string().min(1),
  promoterId: z.string().min(1),
  ticketTypeId: z.string().min(1).nullable().optional(),
  code: z.string().min(3)
});

export const qrValidateSchema = z.object({
  qrToken: z.string().uuid()
});

export const demoRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  venue: z.string().min(1),
  message: z.string().min(1)
});
