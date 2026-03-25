import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export const formatMoney = (cents:number,currency='USD') => new Intl.NumberFormat('en-US',{style:'currency',currency}).format(cents/100);
