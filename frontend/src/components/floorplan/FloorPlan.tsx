import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useMemo,
  useCallback,
  useState,
} from 'react';
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';
import {
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsOut,
  LockSimple,
  LockSimpleOpen,
  ArrowCounterClockwise,
  Plus,
} from '@phosphor-icons/react';
import { Table } from './Table';
import { TableInfoDialog } from './TableInfoDialog';
import { FixedObject, type FixedObjectData } from './FixedObject';
import type { Guest } from '@/lib/supabase';

interface TablePosition {
  x: number;
  y: number;
}

interface FloorPlanProps {
  guests: Guest[];
  tablePositions: Record<number, TablePosition>;
  onPositionChange: (deskNo: number, position: TablePosition) => void;
  onResetPositions: () => void;
  highlightedDeskNos: number[];
  onToggleAttendance: (guest: Guest) => void;
  onGuestClick: (guest: Guest) => void;
  // Fixed objects
  fixedObjects?: FixedObjectData[];
  onUpdateFixedObject?: (object: FixedObjectData) => void;
  onDeleteFixedObject?: (id: string) => void;
  onEditFixedObjectName?: (id: string, name: string) => void;
  onAddFixedObject?: () => void;
  // Background watermark
  backgroundImage?: string;
}

export interface FloorPlanRef {
  focusOnTable: (deskNo: number) => void;
  resetView: () => void;
}

export const FloorPlan = forwardRef<FloorPlanRef, FloorPlanProps>(
  (
    {
      guests,
      tablePositions,
      onPositionChange,
      onResetPositions,
      highlightedDeskNos,
      onToggleAttendance,
      onGuestClick,
      fixedObjects = [],
      onUpdateFixedObject,
      onDeleteFixedObject,
      onEditFixedObjectName,
      onAddFixedObject,
      backgroundImage,
    },
    ref,
  ) => {
    const transformRef = useRef<ReactZoomPanPinchRef>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedTableNo, setSelectedTableNo] = useState<number | null>(null);

    // Group guests by desk
    const guestsByDesk = useMemo(() => {
      const groups = new Map<number, Guest[]>();
      guests.forEach((guest) => {
        const existing = groups.get(guest.desk_no) || [];
        groups.set(guest.desk_no, [...existing, guest]);
      });
      return groups;
    }, [guests]);

    // Get all unique desk numbers
    const deskNumbers = useMemo(
      () => Array.from(guestsByDesk.keys()).sort((a, b) => a - b),
      [guestsByDesk],
    );

    // Focus on a specific table
    const focusOnTable = useCallback(
      (deskNo: number) => {
        const position = tablePositions[deskNo];
        if (position && transformRef.current) {
          const { setTransform } = transformRef.current;
          const containerWidth = window.innerWidth;
          const containerHeight = window.innerHeight - 200;
          const scale = 1.2;
          const x = containerWidth / 2 - position.x * scale;
          const y = containerHeight / 2 - position.y * scale;
          setTransform(x, y, scale, 500);
        }
      },
      [tablePositions],
    );

    const resetView = useCallback(() => {
      if (transformRef.current) {
        transformRef.current.resetTransform(300);
      }
    }, []);

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        focusOnTable,
        resetView,
      }),
      [focusOnTable, resetView],
    );

    // Calculate canvas size based on table positions and fixed objects
    const canvasSize = useMemo(() => {
      const tablePos = Object.values(tablePositions);
      const allPositions = [
        ...tablePos,
        ...fixedObjects.map((obj) => ({
          x: obj.x + obj.width,
          y: obj.y + obj.height,
        })),
      ];

      if (allPositions.length === 0) return { width: 1200, height: 800 };

      const maxX = Math.max(...allPositions.map((p) => p.x)) + 200;
      const maxY = Math.max(...allPositions.map((p) => p.y)) + 200;

      return {
        width: Math.max(1200, maxX),
        height: Math.max(800, maxY),
      };
    }, [tablePositions, fixedObjects]);

    const handleTableClick = (deskNo: number) => {
      if (!isEditMode) {
        setSelectedTableNo(deskNo);
      }
    };

    const selectedTableGuests = selectedTableNo
      ? guestsByDesk.get(selectedTableNo) || []
      : [];

    return (
      <div className="relative w-full h-[calc(100vh-180px)] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden">
        {/* Fixed Watermark Background - doesn't move with zoom */}
        {backgroundImage && (
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.08,
            }}
          />
        )}

        {/* Control buttons */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
          {/* Edit Mode Toggle */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`p-2.5 sm:p-2 rounded-lg shadow-sm border transition-colors ${
              isEditMode
                ? 'bg-rose-500 border-rose-600 text-white hover:bg-rose-600'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title={
              isEditMode ? 'Düzenleme Modunu Kapat' : 'Düzenleme Modunu Aç'
            }
          >
            {isEditMode ? (
              <LockSimpleOpen weight="bold" className="w-5 h-5" />
            ) : (
              <LockSimple weight="bold" className="w-5 h-5" />
            )}
          </button>

          <div className="w-full h-px bg-slate-200 my-0.5" />

          <button
            onClick={() => transformRef.current?.zoomIn(0.3)}
            className="p-2.5 sm:p-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Yakınlaştır"
          >
            <MagnifyingGlassPlus
              weight="bold"
              className="w-5 h-5 text-slate-600"
            />
          </button>
          <button
            onClick={() => transformRef.current?.zoomOut(0.3)}
            className="p-2.5 sm:p-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Uzaklaştır"
          >
            <MagnifyingGlassMinus
              weight="bold"
              className="w-5 h-5 text-slate-600"
            />
          </button>
          <button
            onClick={resetView}
            className="p-2.5 sm:p-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Görünümü Sıfırla"
          >
            <ArrowsOut weight="bold" className="w-5 h-5 text-slate-600" />
          </button>

          {/* Edit Mode Actions */}
          {isEditMode && (
            <>
              <div className="w-full h-px bg-slate-200 my-0.5" />

              {/* Add Fixed Object */}
              {onAddFixedObject && (
                <button
                  onClick={onAddFixedObject}
                  className="p-2.5 sm:p-2 bg-indigo-500 rounded-lg shadow-sm hover:bg-indigo-600 transition-colors"
                  title="Sabit Nesne Ekle"
                >
                  <Plus weight="bold" className="w-5 h-5 text-white" />
                </button>
              )}

              {/* Reset Positions */}
              <button
                onClick={onResetPositions}
                className="p-2.5 sm:p-2 bg-amber-500 rounded-lg shadow-sm hover:bg-amber-600 transition-colors"
                title="Masa Pozisyonlarını Sıfırla"
              >
                <ArrowCounterClockwise
                  weight="bold"
                  className="w-5 h-5 text-white"
                />
              </button>
            </>
          )}
        </div>

        {/* Legend - Responsive */}
        <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-2 sm:gap-4 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-emerald-500 border-2 border-emerald-600" />
            <span className="text-slate-600 hidden sm:inline">Geldi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-slate-200 border-2 border-slate-300" />
            <span className="text-slate-600 hidden sm:inline">Bekliyor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-amber-100 border-2 border-amber-300" />
            <span className="text-slate-600 hidden sm:inline">Masa</span>
          </div>
        </div>

        {/* Zoom/Pan Container */}
        <TransformWrapper
          ref={transformRef}
          initialScale={0.7}
          minScale={0.3}
          maxScale={2}
          centerOnInit
          limitToBounds={false}
          panning={{ velocityDisabled: true, disabled: isEditMode }}
        >
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{
              width: canvasSize.width,
              height: canvasSize.height,
            }}
          >
            {/* Floor pattern background */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Fixed Objects (render behind tables) */}
            {fixedObjects.map((obj) => (
              <FixedObject
                key={obj.id}
                object={obj}
                isDragEnabled={isEditMode}
                onUpdate={onUpdateFixedObject || (() => {})}
                onDelete={onDeleteFixedObject || (() => {})}
                onEditName={onEditFixedObjectName || (() => {})}
              />
            ))}

            {/* Tables */}
            {deskNumbers.map((deskNo) => (
              <Table
                key={deskNo}
                deskNo={deskNo}
                guests={guestsByDesk.get(deskNo) || []}
                position={tablePositions[deskNo] || { x: 100, y: 100 }}
                onPositionChange={onPositionChange}
                isHighlighted={highlightedDeskNos.includes(deskNo)}
                isDragEnabled={isEditMode}
                onTableClick={handleTableClick}
              />
            ))}
          </TransformComponent>
        </TransformWrapper>

        {/* Instructions overlay - Responsive */}
        <div className="absolute top-3 left-3 z-20 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 text-xs text-slate-500">
          {isEditMode ? (
            <span className="text-rose-600 font-medium">
              <span className="hidden sm:inline">Düzenleme Modu: </span>Sürükle
            </span>
          ) : (
            <span className="hidden sm:inline">
              Masaya tıklayarak misafirleri görün
            </span>
          )}
        </div>

        {/* Table Info Dialog */}
        <TableInfoDialog
          deskNo={selectedTableNo || 0}
          guests={selectedTableGuests}
          open={selectedTableNo !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedTableNo(null);
          }}
          onToggleAttendance={onToggleAttendance}
          onGuestClick={onGuestClick}
        />
      </div>
    );
  },
);

FloorPlan.displayName = 'FloorPlan';
