import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Turkish-aware case-insensitive string includes
// Handles İ/i and I/ı correctly
export function turkishIncludes(text: string, search: string): boolean {
  const turkishLower = (str: string) =>
    str.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();

  return turkishLower(text).includes(turkishLower(search));
}
