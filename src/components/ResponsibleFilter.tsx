import React from 'react';
import { Plus, CheckCheck } from 'lucide-react';
import { AppUser } from '../types';

interface ResponsibleFilterProps {
  users: AppUser[];
  selectedUserId: string | null; // null = "Todos"
  onSelectUser: (userId: string | null) => void;
  onQuickAddUser: () => void;
  activeEmployeeId: string;
  isAllSelected?: boolean;
  isSomeSelected?: boolean;
  onToggleSelectAll?: () => void;
  selectedCount?: number;
  onMarkSelectedAsBought?: () => void;
  onClearSelection?: () => void;
}

export const ResponsibleFilter: React.FC<ResponsibleFilterProps> = ({
  users,
  selectedUserId,
  onSelectUser,
  onQuickAddUser,
  activeEmployeeId,
  isAllSelected = false,
  isSomeSelected = false,
  onToggleSelectAll,
  selectedCount = 0,
  onMarkSelectedAsBought,
  onClearSelection,
}) => {
  return (
    <div id="responsible-filter-section" className="px-5 py-3 bg-white border-b border-slate-100">
      <div className="w-full">
        {(selectedCount > 0 && onMarkSelectedAsBought) || selectedUserId ? (
          <div className="flex items-center justify-end mb-2">
            <div className="flex items-center gap-2">
              {selectedCount > 0 && onMarkSelectedAsBought ? (
                <div className="flex items-center gap-1.5">
                  <button
                    id="btn-batch-mark-bought-header"
                    type="button"
                    onClick={onMarkSelectedAsBought}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
                    title="Marcar itens selecionados como comprados"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Comprado ({selectedCount})</span>
                  </button>
                  {onClearSelection && (
                    <button
                      type="button"
                      onClick={onClearSelection}
                      className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer font-medium"
                      title="Desmarcar todos"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              ) : selectedUserId ? (
                <button
                  type="button"
                  onClick={() => onSelectUser(null)}
                  className="text-[10px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  Ver todos
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          {/* Checkbox antes de "Todos", somente o ícone sem nada escrito */}
          {onToggleSelectAll && (
            <label
              htmlFor="filter-master-checkbox"
              className="w-8 h-8 rounded-full border border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 flex items-center justify-center shrink-0 cursor-pointer transition-all shadow-2xs"
              title={isAllSelected ? 'Desmarcar todos' : 'Selecionar todos os produtos'}
            >
              <input
                id="filter-master-checkbox"
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) {
                    el.indeterminate = isSomeSelected;
                  }
                }}
                onChange={onToggleSelectAll}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer accent-blue-600"
              />
            </label>
          )}

          {/* "Todos" Pill matching screenshot */}
          <button
            id="filter-user-all"
            type="button"
            onClick={() => onSelectUser(null)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedUserId === null
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>

          {/* User circular avatars with only the initial letter (E, A, C, J, M...) */}
          {users.map((user) => {
            const isSelected = selectedUserId === user.id;
            const isCurrentActive = activeEmployeeId === user.id;
            const initial = user.avatarInitial || user.name.charAt(0).toUpperCase();
            const color = user.avatarColor || '#3b82f6';

            return (
              <button
                key={user.id}
                id={`filter-user-${user.id}`}
                type="button"
                onClick={() => onSelectUser(isSelected ? null : user.id)}
                className={`relative w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-offset-2 ring-blue-500 scale-105 shadow-sm'
                    : 'hover:scale-105 active:scale-95'
                }`}
                style={{
                  borderWidth: '1.5px',
                  borderColor: color,
                  color: isSelected ? '#ffffff' : color,
                  backgroundColor: isSelected ? color : `${color}18`,
                }}
                title={`${user.name} (${user.role === 'admin' ? 'Admin' : 'Funcionário'}) - Clique para filtrar`}
                aria-label={`Filtrar por ${user.name}`}
              >
                <span>{initial}</span>

                {isCurrentActive && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                    title="Você está conectado como este usuário"
                  />
                )}
              </button>
            );
          })}

          {/* Plus button to add or switch user */}
          <button
            id="btn-filter-add-user"
            type="button"
            onClick={onQuickAddUser}
            className="w-9 h-9 rounded-full border border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-2xs"
            title="Adicionar ou gerenciar funcionários"
            aria-label="Adicionar funcionário"
          >
            <Plus className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>
    </div>
  );
};
