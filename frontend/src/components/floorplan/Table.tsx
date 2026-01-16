import { useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Chair } from './Chair';
import type { Guest } from '@/lib/supabase';

interface TableProps {
    deskNo: number;
    guests: Guest[];
    position: { x: number; y: number };
    onPositionChange: (deskNo: number, position: { x: number; y: number }) => void;
    isHighlighted: boolean;
    isDragEnabled: boolean;
    onTableClick?: (deskNo: number) => void;
}

export function Table({
    deskNo,
    guests,
    position,
    onPositionChange,
    isHighlighted,
    isDragEnabled,
    onTableClick,
}: TableProps) {
    // Motion values for smooth dragging
    const x = useMotionValue(position.x);
    const y = useMotionValue(position.y);
    const isDragging = useRef(false);

    // Update motion values when position prop changes
    if (!isDragging.current) {
        x.set(position.x);
        y.set(position.y);
    }

    // Calculate total person count for this table
    const totalPersons = guests.reduce((sum, g) => sum + g.person_count, 0);
    const attendedCount = guests.filter((g) => g.is_attended === true).length;

    // Table sizing based on capacity
    const baseRadius = 45;
    const radius = Math.max(baseRadius, baseRadius + (totalPersons - 6) * 3);
    const chairRadius = radius + 22;

    // Generate chair positions using polar coordinates
    const getChairPositions = () => {
        const positions: { guest: Guest; x: number; y: number; angle: number }[] = [];
        let currentIndex = 0;

        guests.forEach((guest) => {
            for (let i = 0; i < guest.person_count; i++) {
                const angle = (2 * Math.PI / totalPersons) * currentIndex - Math.PI / 2;
                positions.push({
                    guest,
                    x: chairRadius * Math.cos(angle),
                    y: chairRadius * Math.sin(angle),
                    angle: angle + Math.PI / 2,
                });
                currentIndex++;
            }
        });

        return positions;
    };

    const chairPositions = getChairPositions();

    const handleClick = () => {
        if (!isDragEnabled && !isDragging.current) {
            onTableClick?.(deskNo);
        }
    };

    return (
        <motion.div
            drag={isDragEnabled}
            dragMomentum={false}
            dragElastic={0}
            whileDrag={{ scale: 1.05, zIndex: 100 }}
            onDragStart={() => {
                isDragging.current = true;
            }}
            onDragEnd={() => {
                if (isDragEnabled) {
                    // Save the current position from motion values
                    onPositionChange(deskNo, {
                        x: x.get(),
                        y: y.get(),
                    });
                }
                // Small delay to prevent click firing after drag
                setTimeout(() => {
                    isDragging.current = false;
                }, 100);
            }}
            className={`absolute ${isDragEnabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
            style={{
                x,
                y,
                translateX: '-50%',
                translateY: '-50%',
            }}
            onClick={handleClick}
        >
            {/* Highlight ring */}
            {isHighlighted && (
                <div
                    className="absolute rounded-full border-4 border-indigo-400 animate-pulse pointer-events-none"
                    style={{
                        width: (radius + 35) * 2,
                        height: (radius + 35) * 2,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            )}

            {/* Drag mode indicator ring */}
            {isDragEnabled && (
                <div
                    className="absolute rounded-full border-2 border-dashed border-rose-400 pointer-events-none opacity-60"
                    style={{
                        width: (radius + 30) * 2,
                        height: (radius + 30) * 2,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            )}

            {/* Table circle */}
            <div
                className={`
          relative rounded-full flex items-center justify-center
          shadow-lg transition-all duration-200
          ${isHighlighted
                        ? 'bg-indigo-100 border-4 border-indigo-500'
                        : isDragEnabled
                            ? 'bg-rose-50 border-4 border-rose-300'
                            : 'bg-amber-50 border-4 border-amber-200 hover:border-amber-300 hover:shadow-xl'
                    }
        `}
                style={{
                    width: radius * 2,
                    height: radius * 2,
                }}
            >
                {/* Table number */}
                <div className="text-center select-none pointer-events-none">
                    <div
                        className={`text-2xl font-bold ${isHighlighted
                                ? 'text-indigo-700'
                                : isDragEnabled
                                    ? 'text-rose-700'
                                    : 'text-amber-800'
                            }`}
                    >
                        {deskNo}
                    </div>
                    <div className="text-xs text-slate-500">
                        {attendedCount}/{guests.length}
                    </div>
                </div>
            </div>

            {/* Chairs */}
            {chairPositions.map((chair, index) => (
                <Chair
                    key={`${chair.guest.id}-${index}`}
                    guest={chair.guest}
                    x={chair.x}
                    y={chair.y}
                    angle={chair.angle}
                />
            ))}
        </motion.div>
    );
}
