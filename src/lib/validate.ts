/** Lightweight client-side validation helpers (no external deps). */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isMinLength(value: string, min: number): boolean {
  return value.trim().length >= min;
}

export type FieldError = { field: string; message: string };

export function validateLogin(email: string, password: string): FieldError[] {
  const errors: FieldError[] = [];
  if (!email.trim()) errors.push({ field: 'email', message: 'Email is required.' });
  else if (!isValidEmail(email)) errors.push({ field: 'email', message: 'Enter a valid email (e.g. you@example.com).' });
  if (!password) errors.push({ field: 'password', message: 'Password is required.' });
  return errors;
}

export function validateRegister(name: string, email: string, password: string): FieldError[] {
  const errors: FieldError[] = [];
  if (!isMinLength(name, 2)) errors.push({ field: 'name', message: 'Name must be at least 2 characters.' });
  if (!email.trim()) errors.push({ field: 'email', message: 'Email is required.' });
  else if (!isValidEmail(email)) errors.push({ field: 'email', message: 'Enter a valid email (e.g. you@example.com).' });
  if (!password) errors.push({ field: 'password', message: 'Password is required.' });
  else if (password.length < 8) errors.push({ field: 'password', message: 'Password must be at least 8 characters.' });
  return errors;
}

export function validateContact(name: string, email: string, message: string): FieldError[] {
  const errors: FieldError[] = [];
  if (!isMinLength(name, 2)) errors.push({ field: 'name', message: 'Name must be at least 2 characters.' });
  if (!email.trim()) errors.push({ field: 'email', message: 'Email is required.' });
  else if (!isValidEmail(email)) errors.push({ field: 'email', message: 'Enter a valid email (e.g. you@example.com).' });
  if (message && message.length > 2000) errors.push({ field: 'message', message: 'Message must be under 2000 characters.' });
  return errors;
}

export function validateSettings(name: string, currentPassword: string, newPassword: string): FieldError[] {
  const errors: FieldError[] = [];
  if (!isMinLength(name, 2)) errors.push({ field: 'name', message: 'Name must be at least 2 characters.' });
  if (newPassword && !currentPassword) errors.push({ field: 'currentPassword', message: 'Enter your current password to set a new one.' });
  if (newPassword && newPassword.length < 8) errors.push({ field: 'newPassword', message: 'New password must be at least 8 characters.' });
  if (newPassword && currentPassword && newPassword === currentPassword) errors.push({ field: 'newPassword', message: 'New password must be different from current password.' });
  return errors;
}

export function validateCreateEvent(fd: FormData): FieldError[] {
  const errors: FieldError[] = [];
  const name = (fd.get('name') as string)?.trim();
  const venueId = fd.get('venueId') as string;
  const capacity = Number(fd.get('capacity'));
  const startsAt = fd.get('startsAt') as string;
  const endsAt = fd.get('endsAt') as string;

  if (!name) errors.push({ field: 'name', message: 'Event name is required.' });
  if (!venueId) errors.push({ field: 'venueId', message: 'Please select a venue.' });
  if (!capacity || capacity < 1) errors.push({ field: 'capacity', message: 'Capacity must be at least 1.' });
  if (!startsAt) errors.push({ field: 'startsAt', message: 'Start time is required.' });
  if (!endsAt) errors.push({ field: 'endsAt', message: 'End time is required.' });
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
    errors.push({ field: 'endsAt', message: 'End time must be after start time.' });
  }
  if (startsAt && new Date(startsAt) < new Date()) {
    errors.push({ field: 'startsAt', message: 'Start time cannot be in the past.' });
  }

  return errors;
}
