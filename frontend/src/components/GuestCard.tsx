import { Users, Gift, Warning, Check, Circle } from '@phosphor-icons/react';
import type { Guest } from '@/lib/supabase';

interface GuestCardProps {
  guest: Guest;
  onClick: () => void;
  onToggleAttendance: (guest: Guest) => void;
}

export function GuestCard({
  guest,
  onClick,
  onToggleAttendance,
}: GuestCardProps) {
  const isAttended = guest.is_attended === true;
  const hasNotes = !!guest.description;

  const handleAttendanceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleAttendance(guest);
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white rounded-xl border transition-all duration-200 cursor-pointer group
        ${
          isAttended
            ? 'border-emerald-200 bg-emerald-50/30'
            : 'border-slate-150 hover:border-slate-200 hover:shadow-sm'
        }
      `}
    >
      {/* Attendance indicator strip */}
      {isAttended && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 rounded-l-xl" />
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {/* Warning icon for notes */}
              {hasNotes && (
                <Warning
                  weight="fill"
                  className="w-4 h-4 text-orange-400 shrink-0"
                />
              )}
              <h3
                className={`font-medium truncate transition-colors ${
                  isAttended
                    ? 'text-emerald-800'
                    : 'text-slate-800 group-hover:text-indigo-600'
                }`}
              >
                {guest.full_name}
              </h3>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 mt-1.5">
              <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                <Users weight="bold" className="w-3.5 h-3.5 text-indigo-400" />
                {guest.person_count}
              </span>
              {guest.gift_count > 0 && (
                <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                  <Gift weight="bold" className="w-3.5 h-3.5 text-amber-400" />
                  {guest.gift_count}
                </span>
              )}
            </div>

            {/* Notes preview */}
            {hasNotes && (
              <p className="mt-2 text-xs text-slate-400 line-clamp-1 italic">
                "{guest.description}"
              </p>
            )}
          </div>

          {/* Attendance Toggle Button */}
          <button
            onClick={handleAttendanceClick}
            className={`
              shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all
              ${
                isAttended
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-400'
              }
            `}
            title={
              isAttended ? 'Geldi olarak işaretli' : 'Bekliyor - tıkla işaretle'
            }
          >
            {isAttended ? (
              <Check weight="bold" className="w-4 h-4" />
            ) : (
              <Circle weight="regular" className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
