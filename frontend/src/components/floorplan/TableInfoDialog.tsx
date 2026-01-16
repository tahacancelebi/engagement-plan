import { useState, useCallback } from 'react';
import {
  Users,
  Gift,
  Table as TableIcon,
  Check,
  Circle,
  Warning,
  DotsSixVertical,
  FloppyDisk,
} from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Guest } from '@/lib/supabase';

interface TableInfoDialogProps {
  deskNo: number;
  guests: Guest[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleAttendance: (guest: Guest) => void;
  onGuestClick: (guest: Guest) => void;
  onReorderGuests?: (deskNo: number, guests: Guest[]) => void;
}

export function TableInfoDialog({
  deskNo,
  guests,
  open,
  onOpenChange,
  onToggleAttendance,
  onGuestClick,
  onReorderGuests,
}: TableInfoDialogProps) {
  const [orderedGuests, setOrderedGuests] = useState<Guest[]>(guests);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevGuests, setPrevGuests] = useState(guests);

  // Reset state when dialog opens or guests change (avoid useEffect setState)
  if (open !== prevOpen || guests !== prevGuests) {
    setPrevOpen(open);
    setPrevGuests(guests);
    if (open && (guests !== prevGuests || !prevOpen)) {
      setOrderedGuests(guests);
      setHasChanges(false);
    }
  }

  const totalPeople = orderedGuests.reduce((sum, g) => sum + g.person_count, 0);
  const totalGifts = orderedGuests.reduce((sum, g) => sum + g.gift_count, 0);
  const attendedCount = orderedGuests.filter(
    (g) => g.is_attended === true,
  ).length;

  // Drag and drop handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;

      const newOrder = [...orderedGuests];
      const [removed] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(index, 0, removed);

      setOrderedGuests(newOrder);
      setDraggedIndex(index);
      setHasChanges(true);
    },
    [draggedIndex, orderedGuests],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  // Touch drag handlers for mobile
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (draggedIndex === null) return;
      e.preventDefault();

      const touch = e.touches[0];
      const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
      const targetRow = elements.find((el) =>
        el.getAttribute('data-drag-index'),
      );

      if (targetRow) {
        const targetIndex = parseInt(
          targetRow.getAttribute('data-drag-index') || '0',
        );
        if (targetIndex !== draggedIndex) {
          const newOrder = [...orderedGuests];
          const [removed] = newOrder.splice(draggedIndex, 1);
          newOrder.splice(targetIndex, 0, removed);
          setOrderedGuests(newOrder);
          setDraggedIndex(targetIndex);
          setHasChanges(true);
        }
      }
    },
    [draggedIndex, orderedGuests],
  );

  const handleSaveOrder = () => {
    if (onReorderGuests && hasChanges) {
      onReorderGuests(deskNo, orderedGuests);
      setHasChanges(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open && hasChanges && onReorderGuests) {
      // Auto-save on close
      onReorderGuests(deskNo, orderedGuests);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-white border-slate-200 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <TableIcon weight="duotone" className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-800">
                Masa {deskNo}
              </span>
              <div className="flex items-center gap-3 mt-0.5 text-sm text-slate-500 font-normal">
                <span className="flex items-center gap-1">
                  <Users
                    weight="bold"
                    className="w-3.5 h-3.5 text-indigo-400"
                  />
                  {totalPeople} kişi
                </span>
                <span className="flex items-center gap-1">
                  <Gift weight="bold" className="w-3.5 h-3.5 text-amber-400" />
                  {totalGifts} hediye
                </span>
                <span className="flex items-center gap-1">
                  <Check
                    weight="bold"
                    className="w-3.5 h-3.5 text-emerald-500"
                  />
                  {attendedCount}/{orderedGuests.length}
                </span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Guest List with Drag & Drop */}
        <div className="flex-1 overflow-y-auto py-2 -mx-2 px-2">
          {orderedGuests.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Bu masada henüz misafir yok
            </div>
          ) : (
            <div className="space-y-1.5">
              {onReorderGuests && orderedGuests.length > 1 && (
                <p className="text-xs text-slate-400 mb-2 text-center">
                  Sıralarını değiştirmek için sürükleyin
                </p>
              )}
              {orderedGuests.map((guest, index) => {
                const isAttended = guest.is_attended === true;
                const hasNotes = !!guest.description;

                return (
                  <div
                    key={guest.id}
                    data-drag-index={index}
                    draggable={!!onReorderGuests && orderedGuests.length > 1}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={() =>
                      onReorderGuests && setDraggedIndex(index)
                    }
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleDragEnd}
                    className={`
                      flex items-center gap-2 p-3 rounded-xl cursor-pointer
                      transition-all duration-150 group
                      ${
                        isAttended
                          ? 'bg-emerald-50 hover:bg-emerald-100'
                          : 'bg-slate-50 hover:bg-slate-100'
                      }
                      ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
                      ${onReorderGuests && orderedGuests.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''}
                    `}
                    onClick={() => onGuestClick(guest)}
                  >
                    {/* Drag Handle */}
                    {onReorderGuests && orderedGuests.length > 1 && (
                      <div className="shrink-0 text-slate-300 hover:text-slate-400">
                        <DotsSixVertical weight="bold" className="w-4 h-4" />
                      </div>
                    )}

                    {/* Order number */}
                    <span className="text-xs text-slate-400 w-4 shrink-0">
                      {index + 1}.
                    </span>

                    {/* Attendance Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleAttendance(guest);
                      }}
                      className={`
                        shrink-0 w-7 h-7 rounded-full flex items-center justify-center
                        transition-all duration-150 shadow-sm
                        ${
                          isAttended
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-white text-slate-300 hover:bg-slate-200 hover:text-slate-400 border border-slate-200'
                        }
                      `}
                    >
                      {isAttended ? (
                        <Check weight="bold" className="w-3.5 h-3.5" />
                      ) : (
                        <Circle weight="regular" className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Guest Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {hasNotes && (
                          <Warning
                            weight="fill"
                            className="w-3.5 h-3.5 text-orange-400 shrink-0"
                          />
                        )}
                        <span
                          className={`font-medium truncate text-sm ${
                            isAttended ? 'text-emerald-800' : 'text-slate-700'
                          }`}
                        >
                          {guest.full_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{guest.person_count} kişi</span>
                        {guest.gift_count > 0 && (
                          <span>• {guest.gift_count} hediye</span>
                        )}
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="shrink-0 text-slate-300 group-hover:text-slate-400 transition-colors">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Save Button */}
        {hasChanges && onReorderGuests && (
          <DialogFooter className="pt-3 border-t border-slate-100">
            <Button
              onClick={handleSaveOrder}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <FloppyDisk weight="bold" className="w-4 h-4 mr-2" />
              Sıralamayı Kaydet
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
