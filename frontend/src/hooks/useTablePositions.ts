import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  supabase,
  type Desk,
  loadDesksFromDB,
  updateDeskPositionInDB,
} from '@/lib/supabase';

interface TablePosition {
  x: number;
  y: number;
}

type TablePositions = Record<number, TablePosition>;

const STORAGE_KEY = 'engagement_table_positions';

// Generate default grid positions for tables
function generateDefaultPositions(deskNumbers: number[]): TablePositions {
  const cols = Math.ceil(Math.sqrt(deskNumbers.length));
  const spacingX = 220;
  const spacingY = 220;
  const offsetX = 150;
  const offsetY = 150;

  return deskNumbers.reduce((acc, deskNo, i) => {
    acc[deskNo] = {
      x: (i % cols) * spacingX + offsetX,
      y: Math.floor(i / cols) * spacingY + offsetY,
    };
    return acc;
  }, {} as TablePositions);
}

// Load positions from localStorage
function loadLocalPositions(): TablePositions | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// Save positions to localStorage
function saveLocalPositions(positions: TablePositions): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch (e) {
    console.error('Failed to save table positions to localStorage:', e);
  }
}

// Convert Desk array to TablePositions
function desksToPositions(desks: Desk[]): TablePositions {
  return desks.reduce((acc, desk) => {
    acc[desk.desk_no] = { x: Number(desk.x), y: Number(desk.y) };
    return acc;
  }, {} as TablePositions);
}

export function useTablePositions(guestDeskNumbers: number[]) {
  // Desks loaded from Supabase
  const [supabaseDesks, setSupabaseDesks] = useState<Desk[]>([]);
  const [positions, setPositions] = useState<TablePositions>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const initialLoadDone = useRef(false);

  // Compute all desk numbers from Supabase + guests
  const allDeskNumbers = useMemo(() => {
    const supabaseDeskNos = supabaseDesks.map((d) => d.desk_no);
    const combined = Array.from(
      new Set([...supabaseDeskNos, ...guestDeskNumbers]),
    );
    return combined.sort((a, b) => a - b);
  }, [supabaseDesks, guestDeskNumbers]);

  // Load desks from Supabase on mount
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const loadFromSupabase = async () => {
      const desks = await loadDesksFromDB();
      if (desks && desks.length > 0) {
        setSupabaseDesks(desks);

        const supabasePositions = desksToPositions(desks);
        const localPositions = loadLocalPositions() || {};
        const defaultPositions = generateDefaultPositions(
          desks.map((d) => d.desk_no),
        );

        // Merge: defaults < local < supabase
        setPositions({
          ...defaultPositions,
          ...localPositions,
          ...supabasePositions,
        });
        saveLocalPositions(supabasePositions);
      } else {
        // No Supabase desks, use local + defaults
        const localPositions = loadLocalPositions() || {};
        const defaultPositions = generateDefaultPositions(guestDeskNumbers);
        setPositions({ ...defaultPositions, ...localPositions });
      }
      setIsLoaded(true);
    };

    loadFromSupabase();
  }, []);

  // Update positions when allDeskNumbers change (add defaults for new desks)
  const positionsWithDefaults = useMemo(() => {
    const defaultPositions = generateDefaultPositions(allDeskNumbers);
    const merged: TablePositions = {};
    allDeskNumbers.forEach((deskNo) => {
      merged[deskNo] = positions[deskNo] || defaultPositions[deskNo];
    });
    return merged;
  }, [allDeskNumbers, positions]);

  // Save positions to localStorage when they change
  useEffect(() => {
    if (isLoaded && Object.keys(positions).length > 0) {
      saveLocalPositions(positions);
    }
  }, [positions, isLoaded]);

  const updatePosition = useCallback(
    (deskNo: number, position: TablePosition) => {
      setPositions((prev) => ({
        ...prev,
        [deskNo]: position,
      }));

      // Also save to localStorage immediately
      const currentLocal = loadLocalPositions() || {};
      currentLocal[deskNo] = position;
      saveLocalPositions(currentLocal);

      // Save to Supabase desks table (async, fire and forget)
      updateDeskPositionInDB(deskNo, position.x, position.y);
    },
    [],
  );

  const resetPositions = useCallback(() => {
    const defaults = generateDefaultPositions(allDeskNumbers);
    setPositions(defaults);
    saveLocalPositions(defaults);

    // Also reset in Supabase
    if (supabase) {
      allDeskNumbers.forEach((deskNo) => {
        updateDeskPositionInDB(deskNo, defaults[deskNo].x, defaults[deskNo].y);
      });
    }
  }, [allDeskNumbers]);

  // Reload desks from Supabase
  const reloadDesks = useCallback(async () => {
    const desks = await loadDesksFromDB();
    if (desks && desks.length > 0) {
      setSupabaseDesks(desks);
      const supabasePositions = desksToPositions(desks);
      setPositions((prev) => ({
        ...prev,
        ...supabasePositions,
      }));
    }
  }, []);

  return {
    positions: positionsWithDefaults,
    updatePosition,
    resetPositions,
    reloadDesks,
    allDeskNumbers,
    isLoaded,
  };
}
