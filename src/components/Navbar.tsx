import React from 'react';
import {
  Film,
  Tv,
  Sparkles,
  Plus,
  Search,
  BarChart3,
  Layers,
} from 'lucide-react';
import { MediaType } from '../types/index.ts';

interface NavbarProps {
  currentType: MediaType | 'all';
  onSelectType: (type: MediaType | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewModal: () => void;
  onOpenStatsModal: () => void;
  counts: {
    all: number;
    movie: number;
    series: number;
    anime: number;
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  currentType,
  onSelectType,
  searchQuery,
  onSearchChange,
  onOpenNewModal,
  onOpenStatsModal,
  counts,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/20">
              <Film className="w-5 h-5 text-white" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-2 h-2 text-zinc-950" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                CineTrack
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                Lista & Progresso
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por título, gênero, ano..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-900/90 text-zinc-100 placeholder-zinc-500 rounded-lg border border-zinc-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Stats button */}
            <button
              onClick={onOpenStatsModal}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center gap-1.5"
              title="Ver estatísticas de consumo"
            >
              <BarChart3 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="hidden sm:inline">Estatísticas</span>
            </button>

            {/* Add New Media Button */}
            <button
              onClick={onOpenNewModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Novo Título</span>
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar filmes, séries ou animes..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-900 text-zinc-100 placeholder-zinc-500 rounded-lg border border-zinc-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Media Type Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2.5 pt-1 scrollbar-none border-t border-zinc-900 md:border-t-0">
          <button
            onClick={() => onSelectType('all')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              currentType === 'all'
                ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todos</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                currentType === 'all' ? 'bg-zinc-300 text-zinc-900' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => onSelectType('movie')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              currentType === 'movie'
                ? 'bg-emerald-500 text-white font-semibold shadow-sm shadow-emerald-500/30'
                : 'text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Filmes</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                currentType === 'movie' ? 'bg-emerald-700 text-emerald-100' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {counts.movie}
            </span>
          </button>

          <button
            onClick={() => onSelectType('series')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              currentType === 'series'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-indigo-400 hover:bg-zinc-900'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Séries</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                currentType === 'series' ? 'bg-indigo-800 text-indigo-100' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {counts.series}
            </span>
          </button>

          <button
            onClick={() => onSelectType('anime')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              currentType === 'anime'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/30'
                : 'text-zinc-400 hover:text-amber-400 hover:bg-zinc-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Animes</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                currentType === 'anime' ? 'bg-amber-600 text-amber-100' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {counts.anime}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
