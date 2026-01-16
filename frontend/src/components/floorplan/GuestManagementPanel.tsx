import { useState, type DragEvent } from 'react';
import {
    ArrowCounterClockwise,
    Plus,
    CaretDown,
    Users,
    Check,
    Circle,
    X,
    List,
    ArrowRight,
} from '@phosphor-icons/react';
import type { Guest } from '@/lib/supabase';

interface GuestManagementPanelProps {
    guests: Guest[];
    onResetPositions: () => void;
    onReassignGuest: (guestId: number, newDeskNo: number) => void;
    onAddTable: (deskNo: number) => void;
    onToggleAttendance: (guest: Guest) => void;
}

export function GuestManagementPanel({
    guests,
    onResetPositions,
    onReassignGuest,
    onAddTable,
    onToggleAttendance,
}: GuestManagementPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedTable, setSelectedTable] = useState<number | null>(null);
    const [draggedGuest, setDraggedGuest] = useState<Guest | null>(null);
    const [showAddTable, setShowAddTable] = useState(false);
    const [newTableNo, setNewTableNo] = useState('');
    const [movingGuest, setMovingGuest] = useState<Guest | null>(null);

    // Group guests by desk
    const guestsByDesk = guests.reduce((acc, guest) => {
        const deskNo = guest.desk_no;
        if (!acc[deskNo]) acc[deskNo] = [];
        acc[deskNo].push(guest);
        return acc;
    }, {} as Record<number, Guest[]>);

    const deskNumbers = Object.keys(guestsByDesk)
        .map(Number)
        .sort((a, b) => a - b);

    const handleDragStart = (e: DragEvent, guest: Guest) => {
        setDraggedGuest(guest);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(guest.id));
    };

    const handleDragEnd = () => {
        setDraggedGuest(null);
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: DragEvent, targetDeskNo: number) => {
        e.preventDefault();
        if (draggedGuest && draggedGuest.desk_no !== targetDeskNo) {
            onReassignGuest(draggedGuest.id, targetDeskNo);
        }
        setDraggedGuest(null);
    };

    const handleAddTable = () => {
        const deskNo = parseInt(newTableNo);
        if (deskNo > 0 && !deskNumbers.includes(deskNo)) {
            onAddTable(deskNo);
            setNewTableNo('');
            setShowAddTable(false);
        }
    };

    // Calculate next available desk number
    const nextDeskNo = Math.max(...deskNumbers, 0) + 1;

    // Handle mobile move guest
    const handleMoveGuest = (targetDeskNo: number) => {
        if (movingGuest && movingGuest.desk_no !== targetDeskNo) {
            onReassignGuest(movingGuest.id, targetDeskNo);
            setMovingGuest(null);
        }
    };

    return (
        <>
            {/* Mobile Bottom Sheet */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 shadow-lg lg:hidden">
                {/* Header Bar */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50"
                >
                    <div className="flex items-center gap-2">
                        <List weight="bold" className="w-5 h-5 text-slate-600" />
                        <span className="font-semibold text-slate-700">Masa Yönetimi</span>
                        <span className="text-xs text-slate-400">({deskNumbers.length} masa)</span>
                    </div>
                    <CaretDown
                        weight="bold"
                        className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''
                            }`}
                    />
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="max-h-[70vh] overflow-hidden flex flex-col">
                        {/* Action Buttons */}
                        <div className="flex gap-2 p-3 border-b border-slate-100">
                            <button
                                onClick={() => setShowAddTable(true)}
                                className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 text-white font-medium flex items-center justify-center gap-2"
                            >
                                <Plus weight="bold" className="w-5 h-5" />
                                Yeni Masa
                            </button>
                            <button
                                onClick={onResetPositions}
                                className="py-3 px-4 rounded-xl bg-slate-200 text-slate-700 font-medium"
                                title="Pozisyonları Sıfırla"
                            >
                                <ArrowCounterClockwise weight="bold" className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Add Table Form */}
                        {showAddTable && (
                            <div className="p-4 bg-emerald-50 border-b border-emerald-100">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        value={newTableNo}
                                        onChange={(e) => setNewTableNo(e.target.value)}
                                        placeholder={`Masa no (örn: ${nextDeskNo})`}
                                        className="flex-1 px-4 py-3 text-lg border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleAddTable}
                                        disabled={!newTableNo || deskNumbers.includes(parseInt(newTableNo))}
                                        className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-50"
                                    >
                                        Ekle
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowAddTable(false);
                                            setNewTableNo('');
                                        }}
                                        className="p-3 rounded-xl bg-white border border-slate-200"
                                    >
                                        <X weight="bold" className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Moving Guest Mode */}
                        {movingGuest && (
                            <div className="p-4 bg-indigo-50 border-b border-indigo-200">
                                <div className="text-center mb-3">
                                    <span className="font-medium text-indigo-800">
                                        {movingGuest.full_name}
                                    </span>
                                    <span className="text-indigo-600"> → taşınacak masayı seçin</span>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {deskNumbers
                                        .filter((d) => d !== movingGuest.desk_no)
                                        .map((deskNo) => (
                                            <button
                                                key={deskNo}
                                                onClick={() => handleMoveGuest(deskNo)}
                                                className="px-4 py-2 rounded-lg bg-indigo-500 text-white font-medium"
                                            >
                                                Masa {deskNo}
                                            </button>
                                        ))}
                                    <button
                                        onClick={() => setMovingGuest(null)}
                                        className="px-4 py-2 rounded-lg bg-slate-300 text-slate-700 font-medium"
                                    >
                                        İptal
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Table List */}
                        <div className="flex-1 overflow-y-auto">
                            {deskNumbers.map((deskNo) => {
                                const tableGuests = guestsByDesk[deskNo] || [];
                                const attendedCount = tableGuests.filter((g) => g.is_attended).length;
                                const isSelected = selectedTable === deskNo;

                                return (
                                    <div key={deskNo} className="border-b border-slate-100">
                                        {/* Table Header */}
                                        <button
                                            onClick={() => setSelectedTable(isSelected ? null : deskNo)}
                                            className="w-full flex items-center justify-between p-4 text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                                    <span className="font-bold text-amber-700">{deskNo}</span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-700">
                                                        Masa {deskNo}
                                                    </div>
                                                    <div className="text-sm text-slate-500">
                                                        {tableGuests.length} davetli • {attendedCount} geldi
                                                    </div>
                                                </div>
                                            </div>
                                            <CaretDown
                                                weight="bold"
                                                className={`w-5 h-5 text-slate-400 transition-transform ${isSelected ? 'rotate-180' : ''
                                                    }`}
                                            />
                                        </button>

                                        {/* Guest List */}
                                        {isSelected && (
                                            <div className="px-4 pb-4 space-y-2">
                                                {tableGuests.map((guest) => (
                                                    <div
                                                        key={guest.id}
                                                        className={`
                              flex items-center gap-3 p-3 rounded-xl
                              ${guest.is_attended === true
                                                                ? 'bg-emerald-50'
                                                                : 'bg-slate-50'
                                                            }
                            `}
                                                    >
                                                        {/* Attendance Toggle */}
                                                        <button
                                                            onClick={() => onToggleAttendance(guest)}
                                                            className={`
                                shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                                ${guest.is_attended === true
                                                                    ? 'bg-emerald-500 text-white'
                                                                    : 'bg-white border-2 border-slate-300 text-slate-300'
                                                                }
                              `}
                                                        >
                                                            {guest.is_attended === true ? (
                                                                <Check weight="bold" className="w-5 h-5" />
                                                            ) : (
                                                                <Circle weight="regular" className="w-5 h-5" />
                                                            )}
                                                        </button>

                                                        {/* Guest Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-slate-700 truncate">
                                                                {guest.full_name}
                                                            </div>
                                                            <div className="text-sm text-slate-400">
                                                                {guest.person_count} kişi
                                                            </div>
                                                        </div>

                                                        {/* Move Button */}
                                                        <button
                                                            onClick={() => setMovingGuest(guest)}
                                                            className="px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-medium flex items-center gap-1"
                                                        >
                                                            Taşı
                                                            <ArrowRight weight="bold" className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}

                                                {tableGuests.length === 0 && (
                                                    <div className="text-center py-6 text-slate-400">
                                                        Bu masa boş
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:flex flex-col w-80 bg-white border-l border-slate-200 h-[calc(100vh-180px)]">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2">
                        <List weight="bold" className="w-4 h-4 text-slate-600" />
                        <span className="font-semibold text-slate-700 text-sm">Yönetim</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onResetPositions}
                            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500"
                            title="Sıfırla"
                        >
                            <ArrowCounterClockwise weight="bold" className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowAddTable(true)}
                            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500"
                            title="Masa Ekle"
                        >
                            <Plus weight="bold" className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Table List */}
                <div className="flex-1 overflow-y-auto">
                    {deskNumbers.map((deskNo) => {
                        const tableGuests = guestsByDesk[deskNo] || [];
                        const totalPeople = tableGuests.reduce((sum, g) => sum + g.person_count, 0);
                        const attendedCount = tableGuests.filter((g) => g.is_attended).length;
                        const isExpanded = selectedTable === deskNo;
                        const isDropTarget = draggedGuest && draggedGuest.desk_no !== deskNo;

                        return (
                            <div
                                key={deskNo}
                                className={`border-b border-slate-100 ${isDropTarget ? 'bg-indigo-50' : ''}`}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, deskNo)}
                            >
                                <button
                                    onClick={() => setSelectedTable(isExpanded ? null : deskNo)}
                                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <CaretDown
                                            weight="bold"
                                            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'
                                                }`}
                                        />
                                        <span className="font-semibold text-slate-700">Masa {deskNo}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-slate-500">
                                            <Users weight="bold" className="w-3 h-3 inline mr-0.5" />
                                            {totalPeople}
                                        </span>
                                        <span className="text-emerald-600">
                                            <Check weight="bold" className="w-3 h-3 inline mr-0.5" />
                                            {attendedCount}/{tableGuests.length}
                                        </span>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="pb-2 px-2 space-y-1">
                                        {tableGuests.map((guest) => (
                                            <div
                                                key={guest.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, guest)}
                                                onDragEnd={handleDragEnd}
                                                className={`
                          flex items-center gap-2 p-2 rounded-lg cursor-grab active:cursor-grabbing
                          text-sm
                          ${guest.is_attended === true
                                                        ? 'bg-emerald-50 border border-emerald-200'
                                                        : 'bg-slate-50 border border-slate-200'
                                                    }
                          ${draggedGuest?.id === guest.id ? 'opacity-50' : ''}
                        `}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onToggleAttendance(guest);
                                                    }}
                                                    className={`
                            shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                            ${guest.is_attended === true
                                                            ? 'bg-emerald-500 text-white'
                                                            : 'bg-white border border-slate-300 text-slate-300'
                                                        }
                          `}
                                                >
                                                    {guest.is_attended === true ? (
                                                        <Check weight="bold" className="w-3 h-3" />
                                                    ) : (
                                                        <Circle weight="regular" className="w-3 h-3" />
                                                    )}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-slate-700 truncate text-xs">
                                                        {guest.full_name}
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        {guest.person_count} kişi
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
