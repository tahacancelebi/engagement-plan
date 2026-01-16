import { useState } from 'react';
import { Table, Plus, SpinnerGap } from '@phosphor-icons/react';
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

interface CreateDeskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDesk: (deskNo: number) => void;
  existingDeskNumbers: number[];
}

export function CreateDeskDialog({
  open,
  onOpenChange,
  onCreateDesk,
  existingDeskNumbers,
}: CreateDeskDialogProps) {
  // Suggest next desk number
  const suggestedDeskNo =
    existingDeskNumbers.length > 0 ? Math.max(...existingDeskNumbers) + 1 : 1;

  const [deskNo, setDeskNo] = useState(suggestedDeskNo);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (existingDeskNumbers.includes(deskNo)) {
      setError(`Masa ${deskNo} zaten mevcut.`);
      return;
    }
    if (deskNo < 1 || deskNo > 999) {
      setError('Masa numarası 1-999 arasında olmalı.');
      return;
    }

    setIsCreating(true);
    setError('');
    try {
      await onCreateDesk(deskNo);
      setDeskNo(suggestedDeskNo + 1);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create desk:', error);
      setError('Masa oluşturulamadı.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Table weight="bold" className="w-5 h-5 text-indigo-600" />
            Yeni Masa Oluştur
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Yeni bir masa numarası oluşturun.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Desk Number */}
          <div>
            <label
              htmlFor="deskNumber"
              className="text-sm font-medium text-slate-700 mb-2 block"
            >
              Masa Numarası
            </label>
            <Input
              id="deskNumber"
              type="number"
              min={1}
              max={999}
              value={deskNo}
              onChange={(e) => {
                setDeskNo(parseInt(e.target.value) || 1);
                setError('');
              }}
              className="bg-slate-50 border-slate-200"
              autoFocus
            />
            {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
          </div>

          {/* Existing desks info */}
          <div className="text-xs text-slate-500">
            Mevcut masalar:{' '}
            {existingDeskNumbers.length > 0
              ? existingDeskNumbers.slice(0, 10).join(', ') +
                (existingDeskNumbers.length > 10 ? '...' : '')
              : 'Yok'}
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
            disabled={isCreating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isCreating ? (
              <SpinnerGap weight="bold" className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus weight="bold" className="w-4 h-4 mr-1.5" />
                Oluştur
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
