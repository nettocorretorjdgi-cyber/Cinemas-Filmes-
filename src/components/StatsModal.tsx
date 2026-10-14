import React from 'react';
import {
  X,
  BarChart3,
  Film,
  Tv,
  Sparkles,
  Clock,
  CheckCircle2,
  Star,
  PlayCircle,
  Heart,
} from 'lucide-react';
import { MediaItem } from '../types/index.ts';

interface StatsModalProps {
  items: MediaItem[];
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ items, onClose }) => {
  const totalTitles = items.length;
  const movies = items.filter((i) => i.type === 'movie');
  const series = items.filter((i) => i.type === 'series');
  const animes = items.filter((i) => i.type === 'anime');

  const totalEpisodesWatched = items.reduce((acc, curr) => acc + (curr.episodes_watched || 0), 0);
  const totalEpisodesAvailable = items.reduce((acc, curr) => acc + (curr.episodes_total || 0), 0);

  // Minutes calculation
  const totalMinutesWatched = items.reduce(
    (acc, curr) => acc + (curr.episodes_watched || 0) * (curr.episode_duration_minutes || 24),
    0
  );
  const hours = Math.floor(totalMinutesWatched / 60);
  const days = (hours / 24).toFixed(1);

  // Average Rating
  const ratedItems = items.filter((i) => i.rating > 0);
  const avgRating =
    ratedItems.length > 0
      ? (ratedItems.reduce((acc, curr) => acc + curr.rating, 0) / ratedItems.length).toFixed(1)
      : '0.0';

  // Status breakdown
  const watchingCount = items.filter((i) => i.status === 'watching').length;
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const planCount = items.filter((i) => i.status === 'plan_to_watch').length;
  const favoritesCount = items.filter((i) => i.favorite).length;

  // Genre ranking
  const genreCounts: { [genre: string]: number } = {};
  items.forEach((item) => {
    item.genres.forEach((g) => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
  });
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Estatísticas de Consumo</h2>
              <p className="text-xs text-zinc-400">
                Métricas dos seus filmes, séries e animes assistidos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-[11px] text-zinc-500 block uppercase font-medium">Títulos Salvos</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">
                {totalTitles}
              </span>
            </div>

            <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-[11px] text-zinc-500 block uppercase font-medium">Episódios Vistos</span>
              <span className="text-2xl font-extrabold text-indigo-400 mt-1 block">
                {totalEpisodesWatched}
              </span>
            </div>

            <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-[11px] text-zinc-500 block uppercase font-medium">Tempo Assistido</span>
              <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
                {hours}h
              </span>
              <span className="text-[10px] text-zinc-500">~{days} dias</span>
            </div>

            <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-[11px] text-zinc-500 block uppercase font-medium">Nota Média</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-2xl font-extrabold text-amber-400">
                  {avgRating}
                </span>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
            </div>
          </div>

          {/* Breakdown by Type */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Distribuição por Tipo
            </h3>

            <div className="space-y-2.5">
              {/* Anime */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-amber-400 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Animes ({animes.length})
                  </span>
                  <span className="text-zinc-400">
                    {totalTitles ? Math.round((animes.length / totalTitles) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${totalTitles ? (animes.length / totalTitles) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Series */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-indigo-400 font-medium flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5" /> Séries ({series.length})
                  </span>
                  <span className="text-zinc-400">
                    {totalTitles ? Math.round((series.length / totalTitles) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${totalTitles ? (series.length / totalTitles) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Movies */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5" /> Filmes ({movies.length})
                  </span>
                  <span className="text-zinc-400">
                    {totalTitles ? Math.round((movies.length / totalTitles) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${totalTitles ? (movies.length / totalTitles) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown by Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-3">
              <PlayCircle className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <span className="text-[11px] text-zinc-500 block">Assistindo</span>
                <span className="text-base font-bold text-zinc-200">{watchingCount}</span>
              </div>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[11px] text-zinc-500 block">Concluídos</span>
                <span className="text-base font-bold text-zinc-200">{completedCount}</span>
              </div>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="text-[11px] text-zinc-500 block">Planejados</span>
                <span className="text-base font-bold text-zinc-200">{planCount}</span>
              </div>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-3">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500 shrink-0" />
              <div>
                <span className="text-[11px] text-zinc-500 block">Favoritos</span>
                <span className="text-base font-bold text-zinc-200">{favoritesCount}</span>
              </div>
            </div>
          </div>

          {/* Top Genres Ranking */}
          {topGenres.length > 0 && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Gêneros Mais Frequentes
              </h3>
              <div className="flex flex-wrap gap-2">
                {topGenres.map(([genre, count], idx) => (
                  <div
                    key={genre}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs"
                  >
                    <span className="font-semibold text-zinc-400">#{idx + 1}</span>
                    <span className="text-zinc-200 font-medium">{genre}</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-indigo-300">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
