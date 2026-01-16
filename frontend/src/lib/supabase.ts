import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabase client - can be null if env vars missing
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Type definitions for the guests table (using snake_case to match Supabase)
export interface Guest {
  id: number;
  full_name: string;
  person_count: number;
  desk_no: number;
  gift_count: number;
  description: string | null;
  is_attended: boolean | null;
}

// Raw JSON data type (camelCase from db.json)
export interface GuestRaw {
  fullName: string;
  personCount: number;
  deskNo: number;
  giftCount: number;
  description: string | null;
}

// LocalStorage keys
const STORAGE_KEYS = {
  ATTENDANCE: 'engagement_attendance',
  NOTES: 'engagement_notes',
} as const;

// Get attendance status from localStorage
export function getLocalAttendance(): Record<string, boolean | null> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save attendance status to localStorage
export function saveLocalAttendance(
  guestName: string,
  isAttended: boolean | null
) {
  try {
    const current = getLocalAttendance();
    current[guestName] = isAttended;
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save attendance to localStorage:', e);
  }
}

// Get notes from localStorage
export function getLocalNotes(): Record<string, string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.NOTES);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save notes to localStorage
export function saveLocalNotes(guestName: string, note: string) {
  try {
    const current = getLocalNotes();
    if (note) {
      current[guestName] = note;
    } else {
      delete current[guestName];
    }
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save notes to localStorage:', e);
  }
}

// Convert raw JSON guest to our Guest type
export function convertRawGuest(raw: GuestRaw, index: number): Guest {
  const localAttendance = getLocalAttendance();
  const localNotes = getLocalNotes();

  return {
    id: index + 1,
    full_name: raw.fullName,
    person_count: raw.personCount,
    desk_no: raw.deskNo,
    gift_count: raw.giftCount,
    description: localNotes[raw.fullName] || raw.description,
    is_attended: localAttendance[raw.fullName] ?? null,
  };
}
