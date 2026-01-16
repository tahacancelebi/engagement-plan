import { useState, useEffect, useCallback, useRef } from 'react';
import {
  loadFixedObjectsFromDB,
  createFixedObjectInDB,
  updateFixedObjectInDB,
  deleteFixedObjectFromDB,
  supabase,
} from '@/lib/supabase';

export interface FixedObjectData {
  id: string;
  type: 'rectangle' | 'triangle';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
}

const STORAGE_KEY = 'engagement_fixed_objects';

function generateId(): string {
  return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function loadLocalObjects(): FixedObjectData[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalObjects(objects: FixedObjectData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(objects));
  } catch (e) {
    console.error('Failed to save fixed objects to localStorage:', e);
  }
}

export function useFixedObjects() {
  const [objects, setObjects] = useState<FixedObjectData[]>(() =>
    loadLocalObjects(),
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const initialLoadDone = useRef(false);

  // Load from Supabase on mount
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const loadFromSupabase = async () => {
      if (supabase) {
        const dbObjects = await loadFixedObjectsFromDB();
        if (dbObjects.length > 0) {
          const converted: FixedObjectData[] = dbObjects.map((obj) => ({
            id: obj.id,
            type: obj.type,
            name: obj.name,
            x: Number(obj.x),
            y: Number(obj.y),
            width: Number(obj.width),
            height: Number(obj.height),
            rotation: Number(obj.rotation),
          }));
          setObjects(converted);
          saveLocalObjects(converted);
        }
      }
      setIsLoaded(true);
    };

    loadFromSupabase();
  }, []);

  // Save to localStorage whenever objects change (after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveLocalObjects(objects);
    }
  }, [objects, isLoaded]);

  const addObject = useCallback(
    async (
      type: 'rectangle' | 'triangle',
      name: string,
      x?: number,
      y?: number,
    ) => {
      const newObject: FixedObjectData = {
        id: generateId(),
        type,
        name,
        x: x ?? 200 + Math.random() * 200,
        y: y ?? 200 + Math.random() * 200,
        width: type === 'rectangle' ? 100 : 80,
        height: type === 'rectangle' ? 60 : 80,
        rotation: 0,
      };

      // Try to create in Supabase first
      if (supabase) {
        const dbObj = await createFixedObjectInDB({
          name: newObject.name,
          type: newObject.type,
          x: newObject.x,
          y: newObject.y,
          width: newObject.width,
          height: newObject.height,
          rotation: newObject.rotation,
        });

        if (dbObj) {
          newObject.id = dbObj.id; // Use the DB-generated ID
        }
      }

      setObjects((prev) => [...prev, newObject]);
      return newObject;
    },
    [],
  );

  const updateObject = useCallback(async (updatedObject: FixedObjectData) => {
    setObjects((prev) =>
      prev.map((obj) => (obj.id === updatedObject.id ? updatedObject : obj)),
    );

    // Sync to Supabase
    if (supabase) {
      await updateFixedObjectInDB(updatedObject.id, {
        name: updatedObject.name,
        type: updatedObject.type,
        x: updatedObject.x,
        y: updatedObject.y,
        width: updatedObject.width,
        height: updatedObject.height,
        rotation: updatedObject.rotation,
      });
    }
  }, []);

  const deleteObject = useCallback(async (id: string) => {
    setObjects((prev) => prev.filter((obj) => obj.id !== id));

    // Sync to Supabase
    if (supabase) {
      await deleteFixedObjectFromDB(id);
    }
  }, []);

  const editObjectName = useCallback(async (id: string, name: string) => {
    setObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, name } : obj)),
    );

    // Sync to Supabase
    if (supabase) {
      await updateFixedObjectInDB(id, { name });
    }
  }, []);

  const resetObjects = useCallback(async () => {
    // Delete all from Supabase
    if (supabase) {
      for (const obj of objects) {
        await deleteFixedObjectFromDB(obj.id);
      }
    }

    setObjects([]);
    saveLocalObjects([]);
  }, [objects]);

  return {
    objects,
    addObject,
    updateObject,
    deleteObject,
    editObjectName,
    resetObjects,
    isLoaded,
  };
}
