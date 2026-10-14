import React from 'react';
import {
  PlayCircle,
  Clock,
  CheckCircle,
  PauseCircle,
  XCircle,
  Heart,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { MediaStatus } from '../types/index.ts';

export type SortOption = 'updated_desc' | 'rating_desc' | 'title_asc' | 'progress_desc' | 'year_desc';

interface FilterBarProps {
  currentStatus: MediaStatus | 'all' | 'favorites';
  onSelectStatus: (status: MediaStatus | 'all' | 'favorites') => void;
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  availableGenres: string[];
  currentSort: SortOption;
  onSelectSort: (sort: SortOption) => void;
  statusCounts: {
    all: number;
    watching: number;
    plan_to_watch: number;
    completed: number;
    on_hold: number;
    dropped: number;
    favorites: number;
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  currentStatus,
  onSelectStatus,
  selectedGenre,
  onSelectGenre,
  availableGenres,
  currentSort,
  onSelectSort,
  statusCounts,
}) => {
  const statusTabs: { id: MediaStatus | 'all' | 'favorites'; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: 'Todos', icon: null, count: statusCounts.all },
    { id: 'watching', label: 'Assistindo', icon: <PlayCircle className="w-3.5 h-3.5 text-blue-400" />, count: statusCounts.watching },
    { id: 'plan_to_watch', label: 'Quero Assistir', icon: <Clock className="w-3.5 h-3.5 text-amber-400" />, count: statusCounts.plan_to_watch },
    { id: 'completed', label: 'Concluídos', icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />, count: statusCounts.completed },
    { id: 'favorites', label: 'Favoritos', icon: <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />, count: statusCounts.favorites },
    { id: 'on_hold', label: 'Pausados', icon: <PauseCircle className="w-3.5 h-3.5 text-purple-400" />, count: statusCounts.on_hold },
    { id: 'dropped', label: 'Abandonados', icon: <XCircle className="w-3.5 h-3.5 text-zinc-500" />, count: statusCounts.dropped },
  ];

  return (
    <div className="space-y-3 mb-6">
      {/* Status tab pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {statusTabs.map((tab) => {
          const isActive = currentStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectStatus(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-900 text-zinc-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-zinc-900 text-xs">
        {/* Genre Selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-400 hidden sm:inline">Gênero:</span>
          <select
            value={selectedGenre}
            onChange={(e) => onSelectGenre(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Todos os Gêneros ({availableGenres.length})</option>
            {availableGenres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {selectedGenre !== 'all' && (
            <button
              onClick={() => onSelectGenre('all')}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 underline ml-1"
            >
              Resetar
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-400 hidden sm:inline">Ordenar:</span>
          <select
            value={currentSort}
            onChange={(e) => onSelectSort(e.target.value as SortOption)}
            className="bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="updated_desc">Atualizados Recentemente</option>
            <option value="rating_desc">Maior Nota ⭐</option>
            <option value="progress_desc">Maior Progresso (%)</option>
            <option value="title_asc">Título (A-Z)</option>
            <option value="year_desc">Mais Recentes (Ano)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
