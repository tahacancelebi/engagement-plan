import {
    Users,
    Gift,
    Table as TableIcon,
    Check,
    Circle,
    Warning,
} from '@phosphor-icons/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Guest } from '@/lib/supabase';

interface TableInfoDialogProps {
    deskNo: number;
    guests: Guest[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onToggleAttendance: (guest: Guest) => void;
    onGuestClick: (guest: Guest) => void;
}

export function TableInfoDialog({
    deskNo,
    guests,
    open,
    onOpenChange,
    onToggleAttendance,
    onGuestClick,
}: TableInfoDialogProps) {
    const totalPeople = guests.reduce((sum, g) => sum + g.person_count, 0);
    const totalGifts = guests.reduce((sum, g) => sum + g.gift_count, 0);
    const attendedCount = guests.filter((g) => g.is_attended === true).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg bg-white border-slate-200 max-h-[80vh] overflow-hidden flex flex-col">
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
                                    <Users weight="bold" className="w-3.5 h-3.5 text-indigo-400" />
                                    {totalPeople} kişi
                                </span>
                                <span className="flex items-center gap-1">
                                    <Gift weight="bold" className="w-3.5 h-3.5 text-amber-400" />
                                    {totalGifts} hediye
                                </span>
                                <span className="flex items-center gap-1">
                                    <Check weight="bold" className="w-3.5 h-3.5 text-emerald-500" />
                                    {attendedCount}/{guests.length}
                                </span>
                            </div>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {/* Guest List */}
                <div className="flex-1 overflow-y-auto py-2 -mx-2 px-2">
                    <div className="space-y-1.5">
                        {guests.map((guest) => {
                            const isAttended = guest.is_attended === true;
                            const hasNotes = !!guest.description;

                            return (
                                <div
                                    key={guest.id}
                                    className={`
                    flex items-center gap-3 p-3 rounded-xl cursor-pointer
                    transition-all duration-150 group
                    ${isAttended
                                            ? 'bg-emerald-50 hover:bg-emerald-100'
                                            : 'bg-slate-50 hover:bg-slate-100'
                                        }
                  `}
                                    onClick={() => onGuestClick(guest)}
                                >
                                    {/* Attendance Toggle */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleAttendance(guest);
                                        }}
                                        className={`
                      shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                      transition-all duration-150 shadow-sm
                      ${isAttended
                                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                : 'bg-white text-slate-300 hover:bg-slate-200 hover:text-slate-400 border border-slate-200'
                                            }
                    `}
                                    >
                                        {isAttended ? (
                                            <Check weight="bold" className="w-4 h-4" />
                                        ) : (
                                            <Circle weight="regular" className="w-4 h-4" />
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
                                                className={`font-medium truncate ${isAttended ? 'text-emerald-800' : 'text-slate-700'
                                                    }`}
                                            >
                                                {guest.full_name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                                            <span>{guest.person_count} kişi</span>
                                            {guest.gift_count > 0 && (
                                                <span>• {guest.gift_count} hediye</span>
                                            )}
                                        </div>
                                        {hasNotes && (
                                            <p className="text-xs text-slate-400 mt-1 truncate italic">
                                                "{guest.description}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Arrow indicator */}
                                    <div className="shrink-0 text-slate-300 group-hover:text-slate-400 transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
