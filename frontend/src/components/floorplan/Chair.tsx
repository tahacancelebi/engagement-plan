import { useState } from 'react';
import type { Guest } from '@/lib/supabase';

interface ChairProps {
    guest: Guest;
    angle: number;
    x: number;
    y: number;
}

export function Chair({ guest, angle, x, y }: ChairProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const isAttended = guest.is_attended === true;

    // Get initials from full name
    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            // Handle names like "Ayşe & Abdurrahman KAYHAN"
            const firstName = parts[0].replace('&', '').trim();
            const lastName = parts[parts.length - 1];
            return `${firstName[0]}${lastName[0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div
            className="absolute flex items-center justify-center"
            style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: `translate(-50%, -50%) rotate(${angle}rad)`,
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onTouchStart={() => setShowTooltip(true)}
            onTouchEnd={() => setShowTooltip(false)}
        >
            {/* Chair visual */}
            <div
                className={`
          w-7 h-7 rounded-full flex items-center justify-center
          text-[10px] font-bold shadow-sm border-2 transition-all duration-200
          cursor-pointer select-none
          ${isAttended
                        ? 'bg-emerald-500 border-emerald-600 text-white'
                        : 'bg-slate-200 border-slate-300 text-slate-600'
                    }
        `}
                style={{ transform: `rotate(${-angle}rad)` }}
            >
                {getInitials(guest.full_name)}
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <div
                    className="absolute z-50 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded-md shadow-lg whitespace-nowrap pointer-events-none"
                    style={{
                        transform: `rotate(${-angle}rad) translateY(-40px)`,
                    }}
                >
                    {guest.full_name}
                    {isAttended && (
                        <span className="ml-1 text-emerald-400">✓</span>
                    )}
                    <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-slate-800 transform -translate-x-1/2 rotate-45" />
                </div>
            )}
        </div>
    );
}
