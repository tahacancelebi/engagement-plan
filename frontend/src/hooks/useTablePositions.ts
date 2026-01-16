import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

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

// Load positions from Supabase
async function loadSupabasePositions(): Promise<TablePositions | null> {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('table_positions')
            .select('desk_no, x, y');

        if (error) {
            console.error('Failed to load positions from Supabase:', error);
            return null;
        }

        if (!data || data.length === 0) return null;

        return data.reduce((acc, row) => {
            acc[row.desk_no] = { x: Number(row.x), y: Number(row.y) };
            return acc;
        }, {} as TablePositions);
    } catch (e) {
        console.error('Failed to load positions from Supabase:', e);
        return null;
    }
}

// Save a single position to Supabase
async function saveSupabasePosition(deskNo: number, position: TablePosition): Promise<void> {
    if (!supabase) return;

    try {
        const { error } = await supabase
            .from('table_positions')
            .upsert(
                { desk_no: deskNo, x: position.x, y: position.y },
                { onConflict: 'desk_no' }
            );

        if (error) {
            console.error('Failed to save position to Supabase:', error);
        }
    } catch (e) {
        console.error('Failed to save position to Supabase:', e);
    }
}

export function useTablePositions(deskNumbers: number[]) {
    const [positions, setPositions] = useState<TablePositions>(() => {
        // Initial load from localStorage (synchronous)
        const saved = loadLocalPositions();
        if (saved && Object.keys(saved).length > 0) {
            const defaultPositions = generateDefaultPositions(deskNumbers);
            return { ...defaultPositions, ...saved };
        }
        return generateDefaultPositions(deskNumbers);
    });

    const [isLoaded, setIsLoaded] = useState(false);
    const initialLoadDone = useRef(false);

    // Load from Supabase on mount (async)
    useEffect(() => {
        if (initialLoadDone.current) return;
        initialLoadDone.current = true;

        const loadFromSupabase = async () => {
            const supabasePositions = await loadSupabasePositions();
            if (supabasePositions && Object.keys(supabasePositions).length > 0) {
                setPositions((prev) => {
                    const defaultPositions = generateDefaultPositions(deskNumbers);
                    // Supabase takes priority, then localStorage (prev), then defaults
                    return { ...defaultPositions, ...prev, ...supabasePositions };
                });
                // Also sync to localStorage
                saveLocalPositions(supabasePositions);
            }
            setIsLoaded(true);
        };

        loadFromSupabase();
    }, []);

    // Update positions when deskNumbers change
    useEffect(() => {
        setPositions((prev) => {
            const defaultPositions = generateDefaultPositions(deskNumbers);
            // Keep existing positions, add defaults for new desks only
            const merged: TablePositions = {};
            deskNumbers.forEach((deskNo) => {
                merged[deskNo] = prev[deskNo] || defaultPositions[deskNo];
            });
            return merged;
        });
    }, [deskNumbers.join(',')]);

    // Save positions to localStorage whenever they change (but not on initial load)
    useEffect(() => {
        if (isLoaded) {
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

            // Save to Supabase (async, fire and forget)
            saveSupabasePosition(deskNo, position);
        },
        []
    );

    const resetPositions = useCallback(() => {
        const defaults = generateDefaultPositions(deskNumbers);
        setPositions(defaults);
        saveLocalPositions(defaults);

        // Also reset in Supabase
        if (supabase) {
            deskNumbers.forEach((deskNo) => {
                saveSupabasePosition(deskNo, defaults[deskNo]);
            });
        }
    }, [deskNumbers]);

    return {
        positions,
        updatePosition,
        resetPositions,
        isLoaded,
    };
}
