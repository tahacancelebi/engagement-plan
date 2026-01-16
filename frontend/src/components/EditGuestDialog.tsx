import { useState, useEffect } from 'react';
import {
  Users,
  Gift,
  Table,
  FloppyDisk,
  SpinnerGap,
  Check,
  Trash,
} from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Guest } from '@/lib/supabase';

interface EditGuestDialogProps {
  guest: Guest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    id: number,
    description: string,
    isAttended: boolean | null
  ) => Promise<void>;
}

export function EditGuestDialog({
  guest,
  open,
  onOpenChange,
  onSave,
}: EditGuestDialogProps) {
  const [description, setDescription] = useState('');
  const [isAttended, setIsAttended] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (guest) {
      setDescription(guest.description || '');
      setIsAttended(guest.is_attended);
    }
  }, [guest]);

  const handleSave = async () => {
    if (!guest) return;
    setIsSaving(true);
    try {
      await onSave(guest.id, description, isAttended);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearNote = () => {
    setDescription('');
  };

  if (!guest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-800">
            {guest.full_name}
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Misafir bilgilerini düzenle
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Guest Info */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md">
              <Table weight="bold" className="w-3.5 h-3.5" />
              Masa {guest.desk_no}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-violet-50 text-violet-700 rounded-md">
              <Users weight="bold" className="w-3.5 h-3.5" />
              {guest.person_count}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 rounded-md">
              <Gift weight="bold" className="w-3.5 h-3.5" />
              {guest.gift_count}
            </span>
          </div>

          {/* Attendance Toggle - Simple */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Katılım
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsAttended(true)}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  isAttended === true
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Check weight="bold" className="w-4 h-4" />
                Geldi
              </button>
              <button
                type="button"
                onClick={() => setIsAttended(null)}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  isAttended === null || isAttended === false
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Bekliyor
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="description"
                className="text-sm font-medium text-slate-700"
              >
                Not
              </label>
              {description && (
                <button
                  type="button"
                  onClick={handleClearNote}
                  className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <Trash weight="bold" className="w-3 h-3" />
                  Sıfırla
                </button>
              )}
            </div>
            <Textarea
              id="description"
              placeholder="Not ekle..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-300"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="text-slate-600"
          >
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSaving ? (
              <SpinnerGap weight="bold" className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <FloppyDisk weight="bold" className="w-4 h-4 mr-1.5" />
                Kaydet
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
