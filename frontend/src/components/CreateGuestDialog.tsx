import { useState } from 'react';
import { UserPlus, Table, SpinnerGap } from '@phosphor-icons/react';
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

interface CreateGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGuest: (guest: {
    fullName: string;
    personCount: number;
    deskNo: number;
    giftCount: number;
  }) => void;
  existingDeskNumbers: number[];
  defaultDeskNo?: number;
}

export function CreateGuestDialog({
  open,
  onOpenChange,
  onCreateGuest,
  existingDeskNumbers,
  defaultDeskNo,
}: CreateGuestDialogProps) {
  const [fullName, setFullName] = useState('');
  const [personCount, setPersonCount] = useState(1);
  const [giftCount, setGiftCount] = useState(1);
  const [deskNo, setDeskNo] = useState(
    defaultDeskNo ?? existingDeskNumbers[0] ?? 1,
  );
  const [isCreating, setIsCreating] = useState(false);

  // Update deskNo when defaultDeskNo changes
  const [prevDefaultDeskNo, setPrevDefaultDeskNo] = useState(defaultDeskNo);
  if (defaultDeskNo !== prevDefaultDeskNo) {
    setPrevDefaultDeskNo(defaultDeskNo);
    if (defaultDeskNo !== undefined) {
      setDeskNo(defaultDeskNo);
    }
  }

  const handleCreate = async () => {
    if (!fullName.trim()) return;
    setIsCreating(true);
    try {
      await onCreateGuest({
        fullName: fullName.trim(),
        personCount,
        deskNo,
        giftCount,
      });
      // Reset form
      setFullName('');
      setPersonCount(1);
      setGiftCount(1);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create guest:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <UserPlus weight="bold" className="w-5 h-5 text-indigo-600" />
            Yeni Misafir Ekle
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Yeni bir misafir oluşturun ve masaya atayın.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Name */}
          <div>
            <label
              htmlFor="guestName"
              className="text-sm font-medium text-slate-700 mb-2 block"
            >
              İsim *
            </label>
            <Input
              id="guestName"
              placeholder="Örn: Ahmet & Ayşe YILMAZ"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-slate-50 border-slate-200"
              autoFocus
            />
          </div>

          {/* Desk */}
          <div>
            <label
              htmlFor="deskNo"
              className="text-sm font-medium text-slate-700 mb-2 block"
            >
              <Table weight="bold" className="w-4 h-4 inline mr-1" />
              Masa Numarası
            </label>
            <select
              id="deskNo"
              value={deskNo}
              onChange={(e) => setDeskNo(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {existingDeskNumbers.map((desk) => (
                <option key={desk} value={desk}>
                  Masa {desk}
                </option>
              ))}
            </select>
          </div>

          {/* Person Count & Gift Count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="personCount"
                className="text-sm font-medium text-slate-700 mb-2 block"
              >
                Kişi Sayısı
              </label>
              <Input
                id="personCount"
                type="number"
                min={1}
                max={20}
                value={personCount}
                onChange={(e) => setPersonCount(parseInt(e.target.value) || 1)}
                className="bg-slate-50 border-slate-200"
              />
            </div>
            <div>
              <label
                htmlFor="giftCount"
                className="text-sm font-medium text-slate-700 mb-2 block"
              >
                Hediye Sayısı
              </label>
              <Input
                id="giftCount"
                type="number"
                min={0}
                max={20}
                value={giftCount}
                onChange={(e) => setGiftCount(parseInt(e.target.value) || 0)}
                className="bg-slate-50 border-slate-200"
              />
            </div>
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
            disabled={isCreating || !fullName.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isCreating ? (
              <SpinnerGap weight="bold" className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus weight="bold" className="w-4 h-4 mr-1.5" />
                Oluştur
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
