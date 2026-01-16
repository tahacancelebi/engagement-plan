import { useState, useCallback } from 'react';
import {
  Table,
  Users,
  Gift,
  CaretDown,
  Check,
  Warning,
  Circle,
  DotsSixVertical,
  UserPlus,
} from '@phosphor-icons/react';
import { GuestCard } from './GuestCard';
import type { Guest } from '@/lib/supabase';

interface DeskGroupProps {
  deskNo: number;
  guests: Guest[];
  onGuestClick: (guest: Guest) => void;
  onToggleAttendance: (guest: Guest) => void;
  onReorderGuests?: (deskNo: number, reorderedGuests: Guest[]) => void;
  onAddGuest?: (deskNo: number) => void;
  viewMode: 'card' | 'table';
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function DeskGroup({
  deskNo,
  guests,
  onGuestClick,
  onToggleAttendance,
  onReorderGuests,
  onAddGuest,
  viewMode,
  isExpanded,
  onToggleExpand,
}: DeskGroupProps) {
  const totalPeople = guests.reduce((sum, g) => sum + g.person_count, 0);
  const totalGifts = guests.reduce((sum, g) => sum + g.gift_count, 0);
  const attendedCount = guests.filter((g) => g.is_attended === true).length;

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Add some visual feedback
    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedIndex !== null && draggedIndex !== index) {
        setDragOverIndex(index);
      }
    },
    [draggedIndex],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (
        draggedIndex === null ||
        draggedIndex === dropIndex ||
        !onReorderGuests
      ) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        return;
      }

      // Reorder the guests array
      const reordered = [...guests];
      const [draggedItem] = reordered.splice(draggedIndex, 1);
      reordered.splice(dropIndex, 0, draggedItem);

      onReorderGuests(deskNo, reordered);
      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [draggedIndex, guests, deskNo, onReorderGuests],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      {/* Desk Header - Clickable */}
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <Table weight="duotone" className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Masa {deskNo}
              </h2>
              <p className="text-xs text-slate-500">
                {guests.length} davetiye · {attendedCount}/{guests.length} geldi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <span className="text-slate-500">
                <Users
                  weight="bold"
                  className="w-4 h-4 inline mr-1 text-indigo-400"
                />
                {totalPeople}
              </span>
              <span className="text-slate-500">
                <Gift
                  weight="bold"
                  className="w-4 h-4 inline mr-1 text-amber-400"
                />
                {totalGifts}
              </span>
            </div>

            <CaretDown
              weight="bold"
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </div>
        </div>
      </button>

      {/* Guests Content */}
      {isExpanded && (
        <div className="p-3 border-t border-slate-100">
          {guests.length === 0 ? (
            /* Empty Desk UI */
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="p-3 rounded-full bg-slate-100 mb-3">
                <Users weight="duotone" className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 mb-3">Bu masa henüz boş</p>
              {onAddGuest && (
                <button
                  onClick={() => onAddGuest(deskNo)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <UserPlus weight="bold" className="w-4 h-4" />
                  Misafir Ekle
                </button>
              )}
            </div>
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {guests.map((guest) => (
                <GuestCard
                  key={guest.id}
                  guest={guest}
                  onClick={() => onGuestClick(guest)}
                  onToggleAttendance={onToggleAttendance}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {onReorderGuests && <th className="w-8 py-2 px-1"></th>}
                    <th className="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase w-12"></th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase">
                      İsim
                    </th>
                    <th className="text-center py-2 px-3 text-xs font-medium text-slate-400 uppercase w-16">
                      Kişi
                    </th>
                    <th className="text-center py-2 px-3 text-xs font-medium text-slate-400 uppercase w-16">
                      Hediye
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase">
                      Not
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((guest, index) => {
                    const isAttended = guest.is_attended === true;
                    const hasNotes = !!guest.description;
                    const isDragging = draggedIndex === index;
                    const isDragOver = dragOverIndex === index;

                    return (
                      <tr
                        key={guest.id}
                        draggable={!!onReorderGuests}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragLeave={handleDragLeave}
                        onClick={() => onGuestClick(guest)}
                        className={`cursor-pointer transition-all border-b border-slate-50 last:border-0 ${
                          isDragging
                            ? 'opacity-50 bg-indigo-50'
                            : isDragOver
                              ? 'bg-indigo-100 border-t-2 border-t-indigo-400'
                              : isAttended
                                ? 'bg-emerald-50/50'
                                : 'hover:bg-slate-50'
                        }`}
                      >
                        {onReorderGuests && (
                          <td className="py-2 px-1">
                            <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
                              <DotsSixVertical
                                weight="bold"
                                className="w-4 h-4"
                              />
                            </div>
                          </td>
                        )}
                        <td className="py-2 px-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleAttendance(guest);
                            }}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isAttended
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {isAttended ? (
                              <Check weight="bold" className="w-3 h-3" />
                            ) : (
                              <Circle weight="regular" className="w-3 h-3" />
                            )}
                          </button>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            {hasNotes && (
                              <Warning
                                weight="fill"
                                className="w-3.5 h-3.5 text-orange-400"
                              />
                            )}
                            <span
                              className={`font-medium ${
                                isAttended
                                  ? 'text-emerald-800'
                                  : 'text-slate-700'
                              }`}
                            >
                              {guest.full_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="text-slate-600">
                            {guest.person_count}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="text-slate-600">
                            {guest.gift_count}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-slate-400 text-xs line-clamp-1">
                            {guest.description || '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {onReorderGuests && (
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Sırayı değiştirmek için satırları sürükleyin
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
