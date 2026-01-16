import type { Guest } from '@/lib/supabase';

interface MiniTablePreviewProps {
    deskNo: number;
    guests: Guest[];
    highlightGuestId?: number;
}

export function MiniTablePreview({
    deskNo,
    guests,
    highlightGuestId,
}: MiniTablePreviewProps) {
    const totalPersons = guests.reduce((sum, g) => sum + g.person_count, 0);
    const radius = 50;
    const chairRadius = radius + 18;

    // Generate seat positions
    const seats: { guest: Guest; x: number; y: number; isHighlighted: boolean }[] = [];
    let currentIndex = 0;

    guests.forEach((guest) => {
        for (let i = 0; i < guest.person_count; i++) {
            const angle = (2 * Math.PI / totalPersons) * currentIndex - Math.PI / 2;
            seats.push({
                guest,
                x: chairRadius * Math.cos(angle),
                y: chairRadius * Math.sin(angle),
                isHighlighted: guest.id === highlightGuestId,
            });
            currentIndex++;
        }
    });

    return (
        <div className="flex flex-col items-center">
            <div
                className="relative"
                style={{ width: (chairRadius + 20) * 2, height: (chairRadius + 20) * 2 }}
            >
                {/* Table circle */}
                <div
                    className="absolute rounded-full bg-amber-100 border-4 border-amber-300 flex items-center justify-center"
                    style={{
                        width: radius * 2,
                        height: radius * 2,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    <div className="text-center">
                        <div className="text-xl font-bold text-amber-800">{deskNo}</div>
                        <div className="text-xs text-amber-600">{totalPersons} kişi</div>
                    </div>
                </div>

                {/* Seats */}
                {seats.map((seat, index) => (
                    <div
                        key={`${seat.guest.id}-${index}`}
                        className={`
              absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
              transition-all duration-200
              ${seat.isHighlighted
                                ? 'bg-indigo-500 text-white ring-4 ring-indigo-200 scale-110 z-10'
                                : seat.guest.is_attended
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-200 text-slate-600'
                            }
            `}
                        style={{
                            left: `calc(50% + ${seat.x}px)`,
                            top: `calc(50% + ${seat.y}px)`,
                            transform: 'translate(-50%, -50%)',
                        }}
                        title={seat.guest.full_name}
                    >
                        {seat.guest.full_name.charAt(0)}
                    </div>
                ))}
            </div>

            {/* Guest Legend */}
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs max-w-[200px]">
                {guests.map((guest) => (
                    <div
                        key={guest.id}
                        className={`
              px-2 py-1 rounded-full
              ${guest.id === highlightGuestId
                                ? 'bg-indigo-100 text-indigo-700 font-medium'
                                : guest.is_attended
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600'
                            }
            `}
                    >
                        {guest.full_name.split(' ')[0]} ({guest.person_count})
                    </div>
                ))}
            </div>
        </div>
    );
}
