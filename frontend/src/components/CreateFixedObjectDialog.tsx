import { useState } from 'react';
import { SpinnerGap } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreateFixedObjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (type: 'rectangle' | 'triangle', name: string) => void;
}

export function CreateFixedObjectDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateFixedObjectDialogProps) {
  const [objectType, setObjectType] = useState<'rectangle' | 'triangle'>(
    'rectangle',
  );
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      onCreate(objectType, name.trim());
      setName('');
      setObjectType('rectangle');
      onOpenChange(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-800">
            Sabit Nesne Ekle
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Haritaya sabit dikdörtgen veya üçgen ekleyin (örn: sahne, müzik
            köşesi).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Object Type Selection */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Nesne Tipi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setObjectType('rectangle')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  objectType === 'rectangle'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-12 h-8 bg-blue-200 border-2 border-blue-400 rounded-md" />
                <span className="text-sm font-medium text-slate-700">
                  Dikdörtgen
                </span>
              </button>
              <button
                type="button"
                onClick={() => setObjectType('triangle')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  objectType === 'triangle'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <svg viewBox="0 0 48 40" className="w-12 h-8">
                  <polygon
                    points="24,4 44,36 4,36"
                    fill="#bbf7d0"
                    stroke="#86efac"
                    strokeWidth="2"
                  />
                </svg>
                <span className="text-sm font-medium text-slate-700">
                  Üçgen
                </span>
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="objectName"
              className="text-sm font-medium text-slate-700 mb-2 block"
            >
              Nesne İsmi *
            </label>
            <Input
              id="objectName"
              placeholder="Örn: Sahne, DJ Köşesi, Çiçekler"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-50 border-slate-200"
              autoFocus
            />
          </div>

          {/* Info */}
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
            <p>• Sürükleyip bırakarak konumlandırabilirsiniz</p>
            <p>• Köşelerden boyutlandırabilirsiniz</p>
            <p>• 90° döndürme butonu ile döndürebilirsiniz</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
            className="text-slate-600"
          >
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isCreating ? (
              <SpinnerGap weight="bold" className="w-4 h-4 animate-spin" />
            ) : (
              'Ekle'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
