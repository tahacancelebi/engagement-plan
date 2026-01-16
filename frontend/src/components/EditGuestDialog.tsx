import { useState, useEffect } from 'react';
import {
  FloppyDisk,
  SpinnerGap,
  Check,
  Trash,
  ArrowUp,
  ArrowDown,
  Scissors,
  Users,
  PencilSimple,
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
import { Input } from '@/components/ui/input';
import { MiniTablePreview } from '@/components/floorplan/MiniTablePreview';
import type { Guest } from '@/lib/supabase';

interface EditGuestDialogProps {
  guest: Guest | null;
  tablemates: Guest[];
  allGuests: Guest[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    id: number,
    description: string,
    isAttended: boolean | null,
    deskNo?: number,
    personCount?: number,
    giftCount?: number,
  ) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  onReorderGuest?: (
    guestId: number,
    deskNo: number,
    direction: 'up' | 'down',
  ) => void;
  onSelectGuest?: (guest: Guest) => void;
  onSplitGuest?: (guest: Guest, newNames: string[]) => Promise<void>;
  onRenameGuest?: (id: number, newName: string) => Promise<void>;
  existingDeskNumbers: number[];
}

export function EditGuestDialog({
  guest,
  tablemates,
  allGuests,
  open,
  onOpenChange,
  onSave,
  onDelete,
  onReorderGuest,
  onSelectGuest,
  onSplitGuest,
  onRenameGuest,
  existingDeskNumbers,
}: EditGuestDialogProps) {
  const [description, setDescription] = useState('');
  const [isAttended, setIsAttended] = useState<boolean | null>(null);
  const [deskNo, setDeskNo] = useState(1);
  const [personCount, setPersonCount] = useState(1);
  const [giftCount, setGiftCount] = useState(1);
  const [fullName, setFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSplitConfirm, setShowSplitConfirm] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [splitNames, setSplitNames] = useState<string[]>([]);

  useEffect(() => {
    if (guest) {
      setDescription(guest.description || '');
      setIsAttended(guest.is_attended);
      setDeskNo(guest.desk_no);
      setPersonCount(guest.person_count);
      setGiftCount(guest.gift_count);
      setFullName(guest.full_name);
      setShowDeleteConfirm(false);
      setShowSplitConfirm(false);
      setIsEditingName(false);

      // Initialize split names
      const names: string[] = [];
      for (let i = 0; i < guest.person_count; i++) {
        names.push(`${guest.full_name} - Kişi ${i + 1}`);
      }
      setSplitNames(names);
    }
  }, [guest]);

  const handleSave = async () => {
    if (!guest) return;
    setIsSaving(true);
    try {
      // Save name change if edited
      if (fullName !== guest.full_name && onRenameGuest) {
        await onRenameGuest(guest.id, fullName);
      }

      await onSave(
        guest.id,
        description,
        isAttended,
        deskNo,
        personCount,
        giftCount,
      );
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!guest || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(guest.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSplit = async () => {
    if (!guest || !onSplitGuest || guest.person_count <= 1) return;
    setIsSplitting(true);
    try {
      await onSplitGuest(guest, splitNames);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to split:', error);
    } finally {
      setIsSplitting(false);
      setShowSplitConfirm(false);
    }
  };

  const handleClearNote = () => {
    setDescription('');
  };

  // Handle clicking on a tablemate badge
  const handleTablemateClick = (tablemate: Guest) => {
    if (!guest || tablemate.id === guest.id) return;
    if (onSelectGuest) {
      onSelectGuest(tablemate);
    }
  };

  // Get current guest index in tablemates for reordering
  const currentIndex = tablemates.findIndex((g) => g.id === guest?.id);
  const canMoveUp = currentIndex > 0;
  const canMoveDown = currentIndex < tablemates.length - 1;

  // Check if guest can be split (has multiple persons)
  const canSplit = guest && guest.person_count > 1;

  // Get guests for the selected desk (for preview when changing desk)
  const previewGuests =
    deskNo === guest?.desk_no
      ? tablemates
      : allGuests.filter((g) => g.desk_no === deskNo);

  if (!guest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white border-slate-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            {isEditingName ? (
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-8 text-lg font-semibold"
                autoFocus
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingName(false);
                  if (e.key === 'Escape') {
                    setFullName(guest.full_name);
                    setIsEditingName(false);
                  }
                }}
              />
            ) : (
              <>
                {fullName}
                {onRenameGuest && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                    title="İsmi Düzenle"
                  >
                    <PencilSimple
                      weight="bold"
                      className="w-4 h-4 text-slate-400"
                    />
                  </button>
                )}
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Misafir bilgilerini düzenle
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Tablemates List (simple, no D&D) */}
          {tablemates.length > 1 && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-2 block">
                Masadaki Misafirler
              </label>
              <div className="flex flex-wrap gap-1.5">
                {tablemates.map((tablemate) => (
                  <button
                    key={tablemate.id}
                    onClick={() => handleTablemateClick(tablemate)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      tablemate.id === guest.id
                        ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                        : tablemate.is_attended
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {tablemate.full_name.split(' ')[0]}
                    {tablemate.person_count > 1 &&
                      ` +${tablemate.person_count - 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Guest Info & Desk Assignment */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label
                htmlFor="deskSelect"
                className="text-xs font-medium text-slate-500 mb-1 block"
              >
                Masa
              </label>
              <select
                id="deskSelect"
                value={deskNo}
                onChange={(e) => setDeskNo(parseInt(e.target.value))}
                className="w-full px-2 py-2 text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {existingDeskNumbers.map((desk) => (
                  <option key={desk} value={desk}>
                    {desk}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="personCountEdit"
                className="text-xs font-medium text-slate-500 mb-1 block"
              >
                Kişi
              </label>
              <Input
                id="personCountEdit"
                type="number"
                min={1}
                max={20}
                value={personCount}
                onChange={(e) => setPersonCount(parseInt(e.target.value) || 1)}
                className="h-9 text-sm bg-violet-50 text-violet-700 border-violet-200"
              />
            </div>
            <div>
              <label
                htmlFor="giftCountEdit"
                className="text-xs font-medium text-slate-500 mb-1 block"
              >
                Hediye
              </label>
              <Input
                id="giftCountEdit"
                type="number"
                min={0}
                max={20}
                value={giftCount}
                onChange={(e) => setGiftCount(parseInt(e.target.value) || 0)}
                className="h-9 text-sm bg-amber-50 text-amber-700 border-amber-200"
              />
            </div>
          </div>

          {/* Table Preview */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <MiniTablePreview
              deskNo={deskNo}
              guests={previewGuests}
              highlightGuestId={guest.id}
            />
          </div>

          {/* Reorder & Split Controls */}
          <div className="flex items-center justify-between">
            {/* Reorder buttons */}
            {onReorderGuest && tablemates.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Sıra:</span>
                <button
                  onClick={() => onReorderGuest(guest.id, guest.desk_no, 'up')}
                  disabled={!canMoveUp}
                  className={`p-1.5 rounded-md transition-colors ${
                    canMoveUp
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                  }`}
                  title="Yukarı Taşı"
                >
                  <ArrowUp weight="bold" className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    onReorderGuest(guest.id, guest.desk_no, 'down')
                  }
                  disabled={!canMoveDown}
                  className={`p-1.5 rounded-md transition-colors ${
                    canMoveDown
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                  }`}
                  title="Aşağı Taşı"
                >
                  <ArrowDown weight="bold" className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-400">
                  {currentIndex + 1}/{tablemates.length}
                </span>
              </div>
            )}

            {/* Split Guest Button */}
            {canSplit && onSplitGuest && (
              <button
                onClick={() => setShowSplitConfirm(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
              >
                <Scissors weight="bold" className="w-3.5 h-3.5" />
                Ayır ({personCount} kişi)
              </button>
            )}
          </div>

          {/* Split Confirmation with Name Editing */}
          {showSplitConfirm && (
            <div className="bg-violet-50 rounded-lg p-3 space-y-3">
              <div className="flex items-start gap-2">
                <Users
                  weight="bold"
                  className="w-5 h-5 text-violet-600 mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-violet-800">
                    Davetiyeyi {personCount} kişiye ayır
                  </p>
                  <p className="text-xs text-violet-600 mt-1">
                    Her kişi için isim belirleyin:
                  </p>
                </div>
              </div>

              {/* Name inputs for each person */}
              <div className="space-y-2">
                {splitNames.map((name, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-violet-500 w-6">
                      {index + 1}.
                    </span>
                    <Input
                      value={name}
                      onChange={(e) => {
                        const newNames = [...splitNames];
                        newNames[index] = e.target.value;
                        setSplitNames(newNames);
                      }}
                      className="h-8 text-sm bg-white"
                      placeholder={`Kişi ${index + 1} ismi`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 text-slate-600"
                  onClick={() => setShowSplitConfirm(false)}
                  disabled={isSplitting}
                >
                  İptal
                </Button>
                <Button
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={handleSplit}
                  disabled={isSplitting || splitNames.some((n) => !n.trim())}
                >
                  {isSplitting ? (
                    <SpinnerGap
                      weight="bold"
                      className="w-4 h-4 animate-spin"
                    />
                  ) : (
                    <>
                      <Scissors weight="bold" className="w-4 h-4 mr-1.5" />
                      Ayır
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Attendance Toggle */}
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

          {/* Delete Section */}
          {onDelete && !showSplitConfirm && (
            <div className="pt-2 border-t border-slate-100">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2 text-sm text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash weight="bold" className="w-4 h-4" />
                  Misafiri Sil
                </button>
              ) : (
                <div className="bg-rose-50 rounded-lg p-3 space-y-2">
                  <p className="text-sm text-rose-700 text-center">
                    "{guest.full_name}" silinecek. Emin misiniz?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="flex-1 text-slate-600"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                    >
                      İptal
                    </Button>
                    <Button
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <SpinnerGap
                          weight="bold"
                          className="w-4 h-4 animate-spin"
                        />
                      ) : (
                        'Evet, Sil'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
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
