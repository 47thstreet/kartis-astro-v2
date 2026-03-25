import { UserRole } from '@prisma/client';
const matrix: Record<UserRole, UserRole[]> = {GUEST:['GUEST'],PROMOTER:['PROMOTER','GUEST'],ORGANIZER:['ORGANIZER','STAFF','GUEST'],STAFF:['STAFF','GUEST'],SUPER_ADMIN:['SUPER_ADMIN','ORGANIZER','STAFF','PROMOTER','GUEST']};
export const canAccess = (role: UserRole, required: UserRole) => matrix[role]?.includes(required);
