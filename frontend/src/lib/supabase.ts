import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabase client - can be null if env vars missing
export const supabase: SupabaseClient | null =
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
  display_order?: number;
}

// Fixed Object type
export interface FixedObjectDB {
  id: string;
  name: string;
  type: 'rectangle' | 'triangle';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
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
  FIXED_OBJECTS: 'engagement_fixed_objects',
} as const;

// =====================================================
// LOCAL STORAGE HELPERS
// =====================================================

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
  isAttended: boolean | null,
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

// =====================================================
// SUPABASE API HELPERS
// =====================================================

// Create guest in Supabase
export async function createGuestInDB(
  guest: Omit<Guest, 'id'>,
): Promise<Guest | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('guests')
      .insert({
        full_name: guest.full_name,
        person_count: guest.person_count,
        desk_no: guest.desk_no,
        gift_count: guest.gift_count,
        description: guest.description,
        is_attended: guest.is_attended,
        display_order: guest.display_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create guest:', error);
      return null;
    }

    return data;
  } catch (e) {
    console.error('Error creating guest:', e);
    return null;
  }
}

// Update guest in Supabase
export async function updateGuestInDB(
  id: number,
  updates: Partial<Guest>,
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('guests')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Failed to update guest:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Error updating guest:', e);
    return false;
  }
}

// Delete guest from Supabase
export async function deleteGuestFromDB(id: number): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('guests').delete().eq('id', id);

    if (error) {
      console.error('Failed to delete guest:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Error deleting guest:', e);
    return false;
  }
}

// =====================================================
// FIXED OBJECTS API
// =====================================================

// Load fixed objects from Supabase
export async function loadFixedObjectsFromDB(): Promise<FixedObjectDB[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('fixed_objects')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load fixed objects:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Error loading fixed objects:', e);
    return [];
  }
}

// Create fixed object in Supabase
export async function createFixedObjectInDB(
  obj: Omit<FixedObjectDB, 'id'>,
): Promise<FixedObjectDB | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('fixed_objects')
      .insert(obj)
      .select()
      .single();

    if (error) {
      console.error('Failed to create fixed object:', error);
      return null;
    }

    return data;
  } catch (e) {
    console.error('Error creating fixed object:', e);
    return null;
  }
}

// Update fixed object in Supabase
export async function updateFixedObjectInDB(
  id: string,
  updates: Partial<FixedObjectDB>,
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('fixed_objects')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Failed to update fixed object:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Error updating fixed object:', e);
    return false;
  }
}

// Delete fixed object from Supabase
export async function deleteFixedObjectFromDB(id: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('fixed_objects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete fixed object:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Error deleting fixed object:', e);
    return false;
  }
}

// =====================================================
// GUEST ORDER API
// =====================================================

// Update display order for guests in a desk
export async function updateGuestOrderInDB(
  _deskNo: number,
  guestIds: number[],
): Promise<boolean> {
  if (!supabase) return false;

  try {
    // Update each guest's display_order
    const updates = guestIds.map((id, index) =>
      supabase.from('guests').update({ display_order: index }).eq('id', id),
    );

    await Promise.all(updates);
    return true;
  } catch (e) {
    console.error('Error updating guest order:', e);
    return false;
  }
}
