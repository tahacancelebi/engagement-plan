import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { ArrowClockwise, Trash, PencilSimple } from '@phosphor-icons/react';

export interface FixedObjectData {
  id: string;
  type: 'rectangle' | 'triangle';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
}

interface FixedObjectProps {
  object: FixedObjectData;
  isDragEnabled: boolean;
  onUpdate: (object: FixedObjectData) => void;
  onDelete: (id: string) => void;
  onEditName: (id: string, name: string) => void;
}

// Resize handle styles generator
function getHandlePosition(corner: string): React.CSSProperties {
  const styles: React.CSSProperties = { position: 'absolute' };
  if (corner.includes('n')) styles.top = -10;
  if (corner.includes('s')) styles.bottom = -10;
  if (corner.includes('w')) styles.left = -10;
  if (corner.includes('e')) styles.right = -10;
  return styles;
}

export function FixedObject({
  object,
  isDragEnabled,
  onUpdate,
  onDelete,
  onEditName,
}: FixedObjectProps) {
  const x = useMotionValue(object.x);
  const y = useMotionValue(object.y);
  const isDragging = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(object.name);
  const [activeCorner, setActiveCorner] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const objectRef = useRef<HTMLDivElement>(null);

  // Update motion values when position prop changes
  useEffect(() => {
    if (!isDragging.current) {
      x.set(object.x);
      y.set(object.y);
    }
  }, [object.x, object.y, x, y]);

  // Determine text orientation based on edge ratio
  const edgeRatio =
    Math.max(object.width, object.height) /
    Math.min(object.width, object.height);
  const isWide = object.width > object.height;
  const shouldRotateText = edgeRatio > 2 && !isWide;

  const handleRotate = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const newRotation = ((object.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    onUpdate({
      ...object,
      rotation: newRotation,
    });
  };

  const handleDeleteClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(object.id);
  };

  // Unified resize handler for both mouse and touch
  const handleResizeStart = useCallback(
    (corner: string, clientX: number, clientY: number) => {
      setActiveCorner(corner);

      const startX = clientX;
      const startY = clientY;
      const startWidth = object.width;
      const startHeight = object.height;
      const startObjX = object.x;
      const startObjY = object.y;

      const handleMove = (moveX: number, moveY: number) => {
        const dx = moveX - startX;
        const dy = moveY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startObjX;
        let newY = startObjY;

        if (corner.includes('e')) newWidth = startWidth + dx;
        if (corner.includes('w')) {
          newWidth = startWidth - dx;
          newX = startObjX + dx;
        }
        if (corner.includes('s')) newHeight = startHeight + dy;
        if (corner.includes('n')) {
          newHeight = startHeight - dy;
          newY = startObjY + dy;
        }

        // Minimum size
        newWidth = Math.max(50, newWidth);
        newHeight = Math.max(50, newHeight);

        // Clamp position if size hit minimum
        if (newWidth === 50 && corner.includes('w')) {
          newX = startObjX + startWidth - 50;
        }
        if (newHeight === 50 && corner.includes('n')) {
          newY = startObjY + startHeight - 50;
        }

        onUpdate({
          ...object,
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY,
        });
      };

      const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        handleMove(e.clientX, e.clientY);
      };

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length > 0) {
          handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      };

      const handleEnd = () => {
        setActiveCorner(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleEnd);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      });
      document.addEventListener('touchend', handleEnd);
    },
    [object, onUpdate],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, corner: string) => {
      e.stopPropagation();
      e.preventDefault();
      handleResizeStart(corner, e.clientX, e.clientY);
    },
    [handleResizeStart],
  );

  const handleTouchStartCorner = useCallback(
    (e: React.TouchEvent, corner: string) => {
      e.stopPropagation();
      if (e.touches.length > 0) {
        handleResizeStart(corner, e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [handleResizeStart],
  );

  const handleSaveName = () => {
    onEditName(object.id, editName);
    setIsEditing(false);
  };

  // Toggle controls on tap for mobile
  const handleTap = () => {
    if (isDragEnabled) {
      setShowControls((prev) => !prev);
    }
  };

  const renderShape = () => {
    const transform = `rotate(${object.rotation}deg)`;

    if (object.type === 'triangle') {
      return (
        <div
          className="w-full h-full flex items-center justify-center relative"
          style={{ transform }}
        >
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <polygon
              points="50,5 95,95 5,95"
              fill="#f0fdf4"
              stroke="#86efac"
              strokeWidth="3"
            />
          </svg>
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ transform: `rotate(-${object.rotation}deg)` }}
          >
            <span className="text-xs font-medium text-green-700 text-center px-2 select-none line-clamp-2">
              {object.name}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        className="w-full h-full rounded-md bg-blue-50 border-2 border-blue-300 flex items-center justify-center relative"
        style={{ transform }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none p-2"
          style={{
            transform: shouldRotateText
              ? 'rotate(90deg)'
              : `rotate(-${object.rotation}deg)`,
          }}
        >
          <span className="text-xs font-medium text-blue-700 text-center select-none line-clamp-2">
            {object.name}
          </span>
        </div>
      </div>
    );
  };

  // Pre-calculate handle positions
  const handlePositions = useMemo(
    () => ({
      nw: getHandlePosition('nw'),
      ne: getHandlePosition('ne'),
      sw: getHandlePosition('sw'),
      se: getHandlePosition('se'),
    }),
    [],
  );

  return (
    <>
      <motion.div
        ref={objectRef}
        drag={isDragEnabled && !activeCorner}
        dragMomentum={false}
        dragElastic={0}
        whileDrag={{ scale: 1.02, zIndex: 100 }}
        onDragStart={() => {
          isDragging.current = true;
        }}
        onDragEnd={() => {
          if (isDragEnabled) {
            onUpdate({
              ...object,
              x: x.get(),
              y: y.get(),
            });
          }
          setTimeout(() => {
            isDragging.current = false;
          }, 100);
        }}
        onTap={handleTap}
        className={`absolute touch-none ${isDragEnabled ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{
          x,
          y,
          width: object.width,
          height: object.height,
          zIndex: activeCorner ? 100 : 10,
        }}
      >
        {renderShape()}

        {/* Controls - visible in edit mode */}
        {isDragEnabled && (
          <>
            {/* Action buttons */}
            <div
              className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 transition-opacity pointer-events-auto"
              style={{ opacity: showControls || activeCorner ? 1 : 0.7 }}
            >
              <button
                onClick={handleRotate}
                onTouchEnd={handleRotate}
                className="p-2.5 sm:p-1.5 bg-white rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors touch-none"
                title="90° Döndür"
              >
                <ArrowClockwise
                  weight="bold"
                  className="w-5 h-5 sm:w-3.5 sm:h-3.5 text-slate-600"
                />
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2.5 sm:p-1.5 bg-white rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors touch-none"
                title="İsim Düzenle"
              >
                <PencilSimple
                  weight="bold"
                  className="w-5 h-5 sm:w-3.5 sm:h-3.5 text-slate-600"
                />
              </button>
              <button
                onClick={handleDeleteClick}
                onTouchEnd={handleDeleteClick}
                className="p-2.5 sm:p-1.5 bg-white rounded-lg shadow-md border border-rose-200 hover:bg-rose-50 active:bg-rose-100 transition-colors touch-none"
                title="Sil"
              >
                <Trash
                  weight="bold"
                  className="w-5 h-5 sm:w-3.5 sm:h-3.5 text-rose-600"
                />
              </button>
            </div>

            {/* Resize handles - inline instead of component */}
            <div
              onMouseDown={(e) => handleMouseDown(e, 'nw')}
              onTouchStart={(e) => handleTouchStartCorner(e, 'nw')}
              className={`w-6 h-6 sm:w-4 sm:h-4 bg-indigo-500 border-2 border-white rounded-full shadow-md 
                                ${activeCorner === 'nw' ? 'scale-125' : ''} transition-transform touch-none cursor-nw-resize`}
              style={handlePositions.nw}
            />
            <div
              onMouseDown={(e) => handleMouseDown(e, 'ne')}
              onTouchStart={(e) => handleTouchStartCorner(e, 'ne')}
              className={`w-6 h-6 sm:w-4 sm:h-4 bg-indigo-500 border-2 border-white rounded-full shadow-md 
                                ${activeCorner === 'ne' ? 'scale-125' : ''} transition-transform touch-none cursor-ne-resize`}
              style={handlePositions.ne}
            />
            <div
              onMouseDown={(e) => handleMouseDown(e, 'sw')}
              onTouchStart={(e) => handleTouchStartCorner(e, 'sw')}
              className={`w-6 h-6 sm:w-4 sm:h-4 bg-indigo-500 border-2 border-white rounded-full shadow-md 
                                ${activeCorner === 'sw' ? 'scale-125' : ''} transition-transform touch-none cursor-sw-resize`}
              style={handlePositions.sw}
            />
            <div
              onMouseDown={(e) => handleMouseDown(e, 'se')}
              onTouchStart={(e) => handleTouchStartCorner(e, 'se')}
              className={`w-6 h-6 sm:w-4 sm:h-4 bg-indigo-500 border-2 border-white rounded-full shadow-md 
                                ${activeCorner === 'se' ? 'scale-125' : ''} transition-transform touch-none cursor-se-resize`}
              style={handlePositions.se}
            />
          </>
        )}
      </motion.div>

      {/* Name edit modal */}
      {isEditing && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-200 p-4"
          onClick={() => setIsEditing(false)}
        >
          <div
            className="bg-white rounded-xl p-4 shadow-xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-800 mb-3">
              Nesne İsmi
            </h3>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-base"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                İptal
              </button>
              <button
                onClick={handleSaveName}
                className="px-4 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
