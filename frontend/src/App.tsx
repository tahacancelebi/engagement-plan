import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  MapPin,
  UserPlus,
  Plus,
} from '@phosphor-icons/react';
import {
  supabase,
  type Guest,
  type GuestRaw,
  convertRawGuest,
  saveLocalAttendance,
  saveLocalNotes,
  createGuestInDB,
  updateGuestInDB,
  deleteGuestFromDB,
  updateGuestOrderInDB,
} from '@/lib/supabase';
import { turkishIncludes } from '@/lib/utils';
import { DeskGroup } from '@/components/DeskGroup';
import { EditGuestDialog } from '@/components/EditGuestDialog';
import { CreateGuestDialog } from '@/components/CreateGuestDialog';
import { CreateDeskDialog } from '@/components/CreateDeskDialog';
import { CreateFixedObjectDialog } from '@/components/CreateFixedObjectDialog';
import { StatsBar } from '@/components/StatsBar';
import { FloorPlan, type FloorPlanRef } from '@/components/floorplan';
import { useTablePositions } from '@/hooks/useTablePositions';
import { useFixedObjects } from '@/hooks/useFixedObjects';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import guestsData from '../db.json';
import './App.css';

// Optional: Import a logo image
// import logoImage from '@/assets/logo.png';

type ViewMode = 'card' | 'table' | 'map';
type FilterMode = 'all' | 'attended' | 'pending' | 'has_notes';

// Local storage keys for guest order
const GUEST_ORDER_KEY = 'engagement_guest_order';

// Background image for floor plan (optional - can be a URL or imported image)
const FLOOR_PLAN_BACKGROUND = ''; // Set your image URL here if needed

function getLocalGuestOrder(): Record<number, number[]> {
  try {
    const stored = localStorage.getItem(GUEST_ORDER_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveLocalGuestOrder(order: Record<number, number[]>) {
  try {
    localStorage.setItem(GUEST_ORDER_KEY, JSON.stringify(order));
  } catch (e) {
    console.error('Failed to save guest order:', e);
  }
}

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
  const floorPlanRef = useRef<FloorPlanRef>(null);

  // Dialog states
  const [createGuestDialogOpen, setCreateGuestDialogOpen] = useState(false);
  const [createDeskDialogOpen, setCreateDeskDialogOpen] = useState(false);
  const [createFixedObjectDialogOpen, setCreateFixedObjectDialogOpen] =
    useState(false);

  // Fixed objects hook
  const {
    objects: fixedObjects,
    addObject: addFixedObject,
    updateObject: updateFixedObject,
    deleteObject: deleteFixedObject,
    editObjectName: editFixedObjectName,
  } = useFixedObjects();

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
          .order('display_order', { ascending: true })
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
        convertRawGuest(raw, index),
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

  // Get unique desk numbers for table positions
  const deskNumbers = useMemo(
    () =>
      Array.from(new Set(guests.map((g) => g.desk_no))).sort((a, b) => a - b),
    [guests],
  );

  // Table positions for floor plan
  const {
    positions: tablePositions,
    updatePosition,
    resetPositions,
  } = useTablePositions(deskNumbers);

  // Find ALL highlighted desks based on search query
  const highlightedDeskNos = useMemo(() => {
    if (!searchQuery.trim() || viewMode !== 'map') return [];

    const matchingDesks = new Set<number>();
    guests.forEach((g) => {
      if (
        turkishIncludes(g.full_name, searchQuery) ||
        (g.description && turkishIncludes(g.description, searchQuery))
      ) {
        matchingDesks.add(g.desk_no);
      }
    });
    return Array.from(matchingDesks);
  }, [searchQuery, guests, viewMode]);

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
          (guest.description &&
            turkishIncludes(guest.description, searchQuery)),
      );
    }

    return result;
  }, [guests, searchQuery, filterMode]);

  // Group guests by desk number with custom order
  const groupedByDesk = useMemo(() => {
    const groups = new Map<number, Guest[]>();
    const guestOrder = getLocalGuestOrder();

    filteredGuests.forEach((guest) => {
      const existing = groups.get(guest.desk_no) || [];
      groups.set(guest.desk_no, [...existing, guest]);
    });

    // Apply custom order for each desk
    groups.forEach((deskGuests, deskNo) => {
      const order = guestOrder[deskNo];
      if (order && order.length > 0) {
        deskGuests.sort((a, b) => {
          const indexA = order.indexOf(a.id);
          const indexB = order.indexOf(b.id);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
      }
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
          g.id === guest.id ? { ...g, is_attended: newStatus } : g,
        ),
      );

      // Save to localStorage (always, for offline support)
      saveLocalAttendance(guest.full_name, newStatus);

      // Try to update in Supabase
      if (supabase && !isOffline) {
        await updateGuestInDB(guest.id, { is_attended: newStatus });
      }
    },
    [isOffline],
  );

  // Handle save from dialog (extended with desk and counts)
  const handleSaveDescription = async (
    id: number,
    description: string,
    isAttended: boolean | null,
    deskNo?: number,
    personCount?: number,
    giftCount?: number,
  ) => {
    const guest = guests.find((g) => g.id === id);
    if (!guest) return;

    const updates: Partial<Guest> = {
      description: description || null,
      is_attended: isAttended,
    };

    if (deskNo !== undefined) updates.desk_no = deskNo;
    if (personCount !== undefined) updates.person_count = personCount;
    if (giftCount !== undefined) updates.gift_count = giftCount;

    // Optimistic UI update
    setGuests((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    );

    // Save to localStorage
    saveLocalAttendance(guest.full_name, isAttended);
    saveLocalNotes(guest.full_name, description);

    // Try to update in Supabase
    if (supabase && !isOffline) {
      await updateGuestInDB(id, updates);
    }
  };

  // Handle delete guest
  const handleDeleteGuest = async (id: number) => {
    // Optimistic update
    setGuests((prev) => prev.filter((g) => g.id !== id));

    // Try to delete in Supabase
    if (supabase && !isOffline) {
      await deleteGuestFromDB(id);
    }
  };

  // Handle select guest (from tablemate badges)
  const handleSelectGuest = (guest: Guest) => {
    setSelectedGuest(guest);
  };

  // Handle split guest - creates individual guests from a multi-person invitation
  const handleSplitGuest = async (guest: Guest) => {
    if (guest.person_count <= 1) return;

    const baseName = guest.full_name;
    const newGuests: Guest[] = [];

    // Create individual guests
    for (let i = 0; i < guest.person_count; i++) {
      const newGuest: Omit<Guest, 'id'> = {
        full_name: `${baseName} - Kişi ${i + 1}`,
        person_count: 1,
        desk_no: guest.desk_no,
        gift_count: i === 0 ? guest.gift_count : 0, // First person gets the gifts
        description: i === 0 ? guest.description : null,
        is_attended: null,
        display_order: i,
      };

      if (supabase && !isOffline) {
        const created = await createGuestInDB(newGuest);
        if (created) {
          newGuests.push(created);
        }
      } else {
        // Offline mode - generate local ID
        const localId = Math.max(...guests.map((g) => g.id), 0) + i + 1;
        newGuests.push({ ...newGuest, id: localId });
      }
    }

    // Delete the original guest
    if (supabase && !isOffline) {
      await deleteGuestFromDB(guest.id);
    }

    // Update local state
    setGuests((prev) => [
      ...prev.filter((g) => g.id !== guest.id),
      ...newGuests,
    ]);
  };

  // Handle reorder guests within a desk
  const handleReorderGuests = useCallback(
    (deskNo: number, reorderedGuests: Guest[]) => {
      // Save the new order
      const currentOrder = getLocalGuestOrder();
      currentOrder[deskNo] = reorderedGuests.map((g) => g.id);
      saveLocalGuestOrder(currentOrder);

      // Sync to Supabase
      if (supabase && !isOffline) {
        updateGuestOrderInDB(
          deskNo,
          reorderedGuests.map((g) => g.id),
        );
      }

      // Force re-render by updating guests
      setGuests((prev) => [...prev]);
    },
    [isOffline],
  );

  // Handle reorder guest from dialog (up/down)
  const handleReorderGuest = useCallback(
    (guestId: number, deskNo: number, direction: 'up' | 'down') => {
      const deskGuests = guests.filter((g) => g.desk_no === deskNo);
      const currentOrder =
        getLocalGuestOrder()[deskNo] || deskGuests.map((g) => g.id);

      const currentIndex = currentOrder.indexOf(guestId);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= currentOrder.length) return;

      // Swap
      const newOrder = [...currentOrder];
      [newOrder[currentIndex], newOrder[newIndex]] = [
        newOrder[newIndex],
        newOrder[currentIndex],
      ];

      const allOrders = getLocalGuestOrder();
      allOrders[deskNo] = newOrder;
      saveLocalGuestOrder(allOrders);

      // Sync to Supabase
      if (supabase && !isOffline) {
        updateGuestOrderInDB(deskNo, newOrder);
      }

      // Force re-render
      setGuests((prev) => [...prev]);
    },
    [guests, isOffline],
  );

  // Create new guest
  const handleCreateGuest = async (guestData: {
    fullName: string;
    personCount: number;
    deskNo: number;
    giftCount: number;
  }) => {
    const newGuest: Omit<Guest, 'id'> = {
      full_name: guestData.fullName,
      person_count: guestData.personCount,
      desk_no: guestData.deskNo,
      gift_count: guestData.giftCount,
      description: null,
      is_attended: null,
    };

    let createdGuest: Guest;

    // Try to create in Supabase first
    if (supabase && !isOffline) {
      const dbGuest = await createGuestInDB(newGuest);
      if (dbGuest) {
        createdGuest = dbGuest;
      } else {
        // Fallback to local
        const newId = Math.max(...guests.map((g) => g.id), 0) + 1;
        createdGuest = { ...newGuest, id: newId };
      }
    } else {
      // Offline mode
      const newId = Math.max(...guests.map((g) => g.id), 0) + 1;
      createdGuest = { ...newGuest, id: newId };
    }

    // Update state
    setGuests((prev) => [...prev, createdGuest]);

    // Expand the desk
    setExpandedDesks((prev) => new Set([...prev, guestData.deskNo]));
  };

  // Create new desk
  const handleCreateDesk = async (deskNo: number) => {
    // Add the desk to expanded desks
    setExpandedDesks((prev) => new Set([...prev, deskNo]));
    // The desk will appear when guests are added
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

  // Get tablemates for selected guest
  const selectedGuestTablemates = useMemo(() => {
    if (!selectedGuest) return [];
    const order = getLocalGuestOrder()[selectedGuest.desk_no];
    const tablemates = guests.filter(
      (g) => g.desk_no === selectedGuest.desk_no,
    );
    if (order && order.length > 0) {
      return tablemates.sort((a, b) => {
        const indexA = order.indexOf(a.id);
        const indexB = order.indexOf(b.id);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
    return tablemates;
  }, [selectedGuest, guests]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Mobile First */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Logo placeholder - replace with your image */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                S&Ö
              </div>
              {/* Title - hidden on mobile */}
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight leading-tight">
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
            </div>

            {/* Search Bar - Bigger and more prominent */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlass
                  weight="bold"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                />
                <Input
                  type="text"
                  placeholder="Misafir ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-11 sm:h-12 text-base bg-slate-50 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      const allDesks = new Set(guests.map((g) => g.desk_no));
                      setExpandedDesks(allDesks);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X weight="bold" className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 gap-0.5 flex-shrink-0">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'card'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Kart Görünümü"
              >
                <SquaresFour weight="bold" className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Tablo Görünümü"
              >
                <Rows weight="bold" className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'map'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Harita Görünümü"
              >
                <MapPin weight="bold" className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
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
            {/* Stats Bar - Hide when searching or in map view */}
            {!searchQuery && viewMode !== 'map' && <StatsBar {...stats} />}

            {/* Map View */}
            {viewMode === 'map' ? (
              <FloorPlan
                ref={floorPlanRef}
                guests={guests}
                tablePositions={tablePositions}
                onPositionChange={updatePosition}
                onResetPositions={resetPositions}
                highlightedDeskNos={highlightedDeskNos}
                onToggleAttendance={handleToggleAttendance}
                onGuestClick={(guest: Guest) => {
                  setSelectedGuest(guest);
                  setDialogOpen(true);
                }}
                fixedObjects={fixedObjects}
                onUpdateFixedObject={updateFixedObject}
                onDeleteFixedObject={deleteFixedObject}
                onEditFixedObjectName={editFixedObjectName}
                onAddFixedObject={() => setCreateFixedObjectDialogOpen(true)}
                backgroundImage={FLOOR_PLAN_BACKGROUND}
              />
            ) : (
              <>
                {/* Filter & Actions Bar - Hide when searching */}
                {!searchQuery && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Filter Tabs - Scrollable on mobile */}
                    <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-lg text-xs overflow-x-auto">
                      <button
                        onClick={() => setFilterMode('all')}
                        className={`px-2.5 py-1.5 rounded-md font-medium transition-all whitespace-nowrap ${
                          filterMode === 'all'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500'
                        }`}
                      >
                        Tümü
                      </button>
                      <button
                        onClick={() => setFilterMode('attended')}
                        className={`px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
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
                        className={`px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
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
                        className={`px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
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
                      {/* Add Guest */}
                      <button
                        onClick={() => setCreateGuestDialogOpen(true)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <UserPlus weight="bold" className="w-4 h-4" />
                        <span className="hidden sm:inline">Misafir Ekle</span>
                      </button>
                      {/* Add Desk */}
                      <button
                        onClick={() => setCreateDeskDialogOpen(true)}
                        className="px-2 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 flex items-center gap-1 transition-colors"
                      >
                        <Plus weight="bold" className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Masa</span>
                      </button>
                      <div className="w-px h-4 bg-slate-200 mx-1 hidden sm:block" />
                      <button
                        onClick={expandAll}
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Tümünü Aç"
                      >
                        <ArrowsOutSimple weight="bold" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={collapseAll}
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Tümünü Kapat"
                      >
                        <ArrowsInSimple weight="bold" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Guest Groups by Desk */}
                {groupedByDesk.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-100 p-8 sm:p-12">
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
                      {!searchQuery && filterMode === 'all' && (
                        <Button
                          onClick={() => setCreateGuestDialogOpen(true)}
                          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          <UserPlus weight="bold" className="w-4 h-4 mr-2" />
                          İlk Misafiri Ekle
                        </Button>
                      )}
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
                        onReorderGuests={handleReorderGuests}
                        viewMode={viewMode as 'card' | 'table'}
                        isExpanded={expandedDesks.has(deskNo)}
                        onToggleExpand={() => toggleDesk(deskNo)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Edit Dialog */}
      <EditGuestDialog
        guest={selectedGuest}
        tablemates={selectedGuestTablemates}
        allGuests={guests}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveDescription}
        onDelete={handleDeleteGuest}
        onReorderGuest={handleReorderGuest}
        onSelectGuest={handleSelectGuest}
        onSplitGuest={handleSplitGuest}
        existingDeskNumbers={deskNumbers.length > 0 ? deskNumbers : [1]}
      />

      {/* Create Guest Dialog */}
      <CreateGuestDialog
        open={createGuestDialogOpen}
        onOpenChange={setCreateGuestDialogOpen}
        onCreateGuest={handleCreateGuest}
        existingDeskNumbers={deskNumbers.length > 0 ? deskNumbers : [1]}
      />

      {/* Create Desk Dialog */}
      <CreateDeskDialog
        open={createDeskDialogOpen}
        onOpenChange={setCreateDeskDialogOpen}
        onCreateDesk={handleCreateDesk}
        existingDeskNumbers={deskNumbers}
      />

      {/* Create Fixed Object Dialog */}
      <CreateFixedObjectDialog
        open={createFixedObjectDialogOpen}
        onOpenChange={setCreateFixedObjectDialogOpen}
        onCreate={(type, name) => addFixedObject(type, name)}
      />
    </div>
  );
}

export default App;
