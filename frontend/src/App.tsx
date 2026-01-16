import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MagnifyingGlass,
  SpinnerGap,
  Warning,
  ArrowClockwise,
  SquaresFour,
  Rows,
  FunnelSimple,
  Check,
  NotePencil,
  Circle,
  ArrowsOutSimple,
  ArrowsInSimple,
  WifiSlash,
  X,
} from '@phosphor-icons/react';
import {
  supabase,
  type Guest,
  type GuestRaw,
  convertRawGuest,
  saveLocalAttendance,
  saveLocalNotes,
} from '@/lib/supabase';
import { turkishIncludes } from '@/lib/utils';
import { DeskGroup } from '@/components/DeskGroup';
import { EditGuestDialog } from '@/components/EditGuestDialog';
import { StatsBar } from '@/components/StatsBar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import guestsData from '../db.json';
import './App.css';

type ViewMode = 'card' | 'table';
type FilterMode = 'all' | 'attended' | 'pending' | 'has_notes';

function App() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [expandedDesks, setExpandedDesks] = useState<Set<number>>(new Set());

  // Fetch guests from Supabase or fallback to db.json
  const fetchGuests = async () => {
    setLoading(true);
    setError(null);

    // Try Supabase first
    if (supabase) {
      try {
        const { data, error: fetchError } = await supabase
          .from('guests')
          .select('*')
          .order('desk_no', { ascending: true })
          .order('full_name', { ascending: true });

        if (fetchError) throw fetchError;

        setGuests(data || []);
        setIsOffline(false);

        // Expand all desks by default
        const deskNos = new Set((data || []).map((g) => g.desk_no));
        setExpandedDesks(deskNos);
        setLoading(false);
        return;
      } catch (err) {
        console.error('Supabase error, falling back to local data:', err);
        setIsOffline(true);
      }
    } else {
      setIsOffline(true);
    }

    // Fallback to db.json with localStorage for attendance/notes
    try {
      const rawGuests = guestsData as GuestRaw[];
      const convertedGuests = rawGuests.map((raw, index) =>
        convertRawGuest(raw, index)
      );
      setGuests(convertedGuests);

      // Expand all desks by default
      const deskNos = new Set(convertedGuests.map((g) => g.desk_no));
      setExpandedDesks(deskNos);
    } catch (err) {
      console.error('Error loading local data:', err);
      setError('Veri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const totalGuests = guests.reduce((sum, g) => sum + g.person_count, 0);
    const totalGifts = guests.reduce((sum, g) => sum + g.gift_count, 0);
    const uniqueTables = new Set(guests.map((g) => g.desk_no));
    const attendedCount = guests.filter((g) => g.is_attended === true).length;
    const hasNotesCount = guests.filter((g) => !!g.description).length;
    return {
      totalInvitations: guests.length,
      totalGuests,
      totalGifts,
      totalTables: uniqueTables.size,
      attendedCount,
      hasNotesCount,
    };
  }, [guests]);

  // Filter guests based on search query and filter mode
  const filteredGuests = useMemo(() => {
    let result = guests;

    // Apply filter
    if (filterMode === 'attended') {
      result = result.filter((g) => g.is_attended === true);
    } else if (filterMode === 'pending') {
      result = result.filter((g) => g.is_attended !== true);
    } else if (filterMode === 'has_notes') {
      result = result.filter((g) => !!g.description);
    }

    // Apply search with Turkish-aware comparison
    if (searchQuery.trim()) {
      result = result.filter(
        (guest) =>
          turkishIncludes(guest.full_name, searchQuery) ||
          (guest.description && turkishIncludes(guest.description, searchQuery))
      );
    }

    return result;
  }, [guests, searchQuery, filterMode]);

  // Group guests by desk number
  const groupedByDesk = useMemo(() => {
    const groups = new Map<number, Guest[]>();
    filteredGuests.forEach((guest) => {
      const existing = groups.get(guest.desk_no) || [];
      groups.set(guest.desk_no, [...existing, guest]);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);
  }, [filteredGuests]);

  // Auto-expand desks when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      // When searching, expand all desks that have matching results
      const matchingDesks = new Set(filteredGuests.map((g) => g.desk_no));
      setExpandedDesks(matchingDesks);
    }
  }, [searchQuery, filteredGuests]);

  // Handle guest card click
  const handleGuestClick = (guest: Guest) => {
    setSelectedGuest(guest);
    setDialogOpen(true);
  };

  // Toggle attendance: null/false -> true, true -> null
  const handleToggleAttendance = useCallback(
    async (guest: Guest) => {
      const newStatus = guest.is_attended === true ? null : true;

      // Optimistic update
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guest.id ? { ...g, is_attended: newStatus } : g
        )
      );

      // Save to localStorage (always, for offline support)
      saveLocalAttendance(guest.full_name, newStatus);

      // Try to update in Supabase
      if (supabase && !isOffline) {
        const { error: updateError } = await supabase
          .from('guests')
          .update({ is_attended: newStatus })
          .eq('id', guest.id);

        if (updateError) {
          console.error(
            'Failed to update attendance in Supabase:',
            updateError
          );
        }
      }
    },
    [isOffline]
  );

  // Handle save from dialog
  const handleSaveDescription = async (
    id: number,
    description: string,
    isAttended: boolean | null
  ) => {
    const guest = guests.find((g) => g.id === id);
    if (!guest) return;

    // Optimistic UI update
    setGuests((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, description: description || null, is_attended: isAttended }
          : g
      )
    );

    // Save to localStorage
    saveLocalAttendance(guest.full_name, isAttended);
    saveLocalNotes(guest.full_name, description);

    // Try to update in Supabase
    if (supabase && !isOffline) {
      const { error: updateError } = await supabase
        .from('guests')
        .update({ description: description || null, is_attended: isAttended })
        .eq('id', id);

      if (updateError) {
        console.error('Failed to update in Supabase:', updateError);
      }
    }
  };

  // Toggle desk expansion
  const toggleDesk = (deskNo: number) => {
    setExpandedDesks((prev) => {
      const next = new Set(prev);
      if (next.has(deskNo)) {
        next.delete(deskNo);
      } else {
        next.add(deskNo);
      }
      return next;
    });
  };

  // Expand/Collapse all
  const expandAll = () => {
    const allDesks = new Set(guests.map((g) => g.desk_no));
    setExpandedDesks(allDesks);
  };

  const collapseAll = () => {
    setExpandedDesks(new Set());
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Title */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Sena & Ömer
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500">Nişan Davetiyesi</p>
                {isOffline && (
                  <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                    <WifiSlash weight="bold" className="w-3 h-3" />
                    Çevrimdışı
                  </span>
                )}
              </div>
            </div>

            {/* Search & View Controls */}
            <div className="flex items-center gap-3">
              <div className="relative w-48 sm:w-56">
                <MagnifyingGlass
                  weight="bold"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                />
                <Input
                  type="text"
                  placeholder="Ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm bg-slate-50 border-slate-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      const allDesks = new Set(guests.map((g) => g.desk_no));
                      setExpandedDesks(allDesks);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X weight="bold" className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'card'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <SquaresFour weight="bold" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'table'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Rows weight="bold" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* Error State */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warning weight="bold" className="w-4 h-4 text-rose-500" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchGuests}
              className="text-rose-600"
            >
              <ArrowClockwise weight="bold" className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <SpinnerGap
              weight="bold"
              className="w-8 h-8 text-indigo-500 animate-spin mb-3"
            />
            <p className="text-slate-500 text-sm">Yükleniyor...</p>
          </div>
        ) : (
          <>
            {/* Stats Bar - Hide when searching */}
            {!searchQuery && <StatsBar {...stats} />}

            {/* Filter & Actions Bar - Hide when searching */}
            {!searchQuery && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Filter Tabs */}
                <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-lg text-xs">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${
                      filterMode === 'all'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    Tümü
                  </button>
                  <button
                    onClick={() => setFilterMode('attended')}
                    className={`px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                      filterMode === 'attended'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    <Check weight="bold" className="w-3 h-3" />
                    Geldi
                  </button>
                  <button
                    onClick={() => setFilterMode('pending')}
                    className={`px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                      filterMode === 'pending'
                        ? 'bg-white text-slate-600 shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    <Circle weight="bold" className="w-3 h-3" />
                    Bekleyen
                  </button>
                  <button
                    onClick={() => setFilterMode('has_notes')}
                    className={`px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                      filterMode === 'has_notes'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    <NotePencil weight="bold" className="w-3 h-3" />
                    Notlu
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={expandAll}
                    className="px-2 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 flex items-center gap-1 transition-colors"
                  >
                    <ArrowsOutSimple weight="bold" className="w-3.5 h-3.5" />
                    Tümünü Aç
                  </button>
                  <button
                    onClick={collapseAll}
                    className="px-2 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 flex items-center gap-1 transition-colors"
                  >
                    <ArrowsInSimple weight="bold" className="w-3.5 h-3.5" />
                    Tümünü Kapat
                  </button>
                </div>
              </div>
            )}

            {/* Result Count - Hide when searching to keep it clean */}
            {!searchQuery && (searchQuery || filterMode !== 'all') && (
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  {filteredGuests.length}
                </span>{' '}
                sonuç
              </p>
            )}

            {/* Guest Groups by Desk */}
            {groupedByDesk.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="p-3 rounded-xl bg-slate-100 mb-3">
                    <FunnelSimple
                      weight="duotone"
                      className="w-8 h-8 text-slate-400"
                    />
                  </div>
                  <h3 className="font-medium text-slate-700 mb-1">
                    {searchQuery || filterMode !== 'all'
                      ? 'Sonuç Yok'
                      : 'Misafir Yok'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {searchQuery || filterMode !== 'all'
                      ? 'Filtreleri değiştirin'
                      : 'Liste boş'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {groupedByDesk.map(([deskNo, deskGuests]) => (
                  <DeskGroup
                    key={deskNo}
                    deskNo={deskNo}
                    guests={deskGuests}
                    onGuestClick={handleGuestClick}
                    onToggleAttendance={handleToggleAttendance}
                    viewMode={viewMode}
                    isExpanded={expandedDesks.has(deskNo)}
                    onToggleExpand={() => toggleDesk(deskNo)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Edit Dialog */}
      <EditGuestDialog
        guest={selectedGuest}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveDescription}
      />
    </div>
  );
}

export default App;
