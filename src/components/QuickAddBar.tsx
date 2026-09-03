import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { AppUser } from '../types';
import { capitalizeWords } from '../utils/text';

interface QuickAddBarProps {
  currentUser: AppUser;
  onQuickAdd: (productName: string) => Promise<void>;
  onOpenFullForm: (prefillName?: string) => void;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  currentUser,
  onQuickAdd,
  onOpenFullForm,
}) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await onQuickAdd(trimmed);
      setName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="quick-add-container"
      className="px-5 py-2.5 bg-white border-t border-slate-100 shrink-0 z-10"
    >
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 bg-slate-100 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500 transition-all"
      >
        <input
          id="quick-add-input"
          type="text"
          value={name}
          onChange={(e) => setName(capitalizeWords(e.target.value))}
          placeholder="Adicionar produto rapidamente..."
          autoCapitalize="words"
          autoComplete="off"
          className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 px-2.5 py-1 focus:outline-hidden"
        />

        <button
          id="btn-quick-add-submit"
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-30 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg shadow-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isSubmitting ? '...' : 'Adicionar'}</span>
        </button>
      </form>
    </div>
  );
};
