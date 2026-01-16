import {
  Users,
  Gift,
  SquaresFour,
  Rows,
  Check,
  NotePencil,
} from '@phosphor-icons/react';

interface StatsBarProps {
  totalGuests: number;
  totalGifts: number;
  totalTables: number;
  totalInvitations: number;
  attendedCount: number;
  hasNotesCount: number;
}

export function StatsBar({
  totalGuests,
  totalGifts,
  totalTables,
  totalInvitations,
  attendedCount,
  hasNotesCount,
}: StatsBarProps) {
  const stats = [
    {
      label: 'Davetiye',
      value: totalInvitations,
      icon: Rows,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
    },
    {
      label: 'Kişi',
      value: totalGuests,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Hediye',
      value: totalGifts,
      icon: Gift,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Masa',
      value: totalTables,
      icon: SquaresFour,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Geldi',
      value: attendedCount,
      icon: Check,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Not Var',
      value: hasNotesCount,
      icon: NotePencil,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-xl p-3 border border-slate-100 hover:border-slate-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${stat.bg}`}>
              <stat.icon weight="bold" className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-slate-800 tabular-nums">
                {stat.value}
              </p>
              <p className="text-xs text-slate-500 truncate">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
