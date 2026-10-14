import React from 'react';
import {
  Film,
  Tv,
  Sparkles,
  Heart,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  PlayCircle,
  PauseCircle,
  XCircle,
  Star,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MediaItem, MediaStatus } from '../types/index.ts';

interface MediaCardProps {
  item: MediaItem;
  onClick: () => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onIncrementEpisode: (id: string, e: React.MouseEvent) => void;
  onDecrementEpisode: (id: string, e: React.MouseEvent) => void;
  onChangeStatus: (id: string, newStatus: MediaStatus, e: React.MouseEvent) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  onClick,
  onToggleFavorite,
  onIncrementEpisode,
  onDecrementEpisode,
  onChangeStatus,
}) => {
  const isSeriesOrAnime = item.type === 'series' || item.type === 'anime';
  const progressPercent = item.episodes_total > 0
    ? Math.min(100, Math.round((item.episodes_watched / item.episodes_total) * 100))
    : 0;

  const isCompleted = item.status === 'completed' || (item.episodes_total > 0 && item.episodes_watched >= item.episodes_total);

  const getStatusBadge = (status: MediaStatus) => {
    switch (status) {
      case 'watching':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-blue-400 bg-blue-950/70 border border-blue-800/60 px-2 py-0.5 rounded-full">
            <PlayCircle className="w-3 h-3" /> Assistindo
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Concluído
          </span>
        );
      case 'plan_to_watch':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-950/70 border border-amber-800/60 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" /> Quero Ver
          </span>
        );
      case 'on_hold':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-purple-300 bg-purple-950/70 border border-purple-800/60 px-2 py-0.5 rounded-full">
            <PauseCircle className="w-3 h-3" /> Pausado
          </span>
        );
      case 'dropped':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3" /> Abandonado
          </span>
        );
    }
  };

  const getTypeBadge = () => {
    switch (item.type) {
      case 'movie':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-emerald-500/90 text-white shadow-sm">
            <Film className="w-2.5 h-2.5" /> Filme
          </span>
        );
      case 'series':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-indigo-600/90 text-white shadow-sm">
            <Tv className="w-2.5 h-2.5" /> Série
          </span>
        );
      case 'anime':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-amber-500 text-zinc-950 shadow-sm">
            <Sparkles className="w-2.5 h-2.5" /> Anime
          </span>
        );
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.episodes_watched + 1 === item.episodes_total) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
      });
    }
    onIncrementEpisode(item.id, e);
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700/80 rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200 cursor-pointer flex flex-col"
    >
      {/* Top Banner / Poster Thumbnail */}
      <div className="relative aspect-[16/10] sm:aspect-[16/11] w-full bg-zinc-950 overflow-hidden">
        {item.poster_url || item.banner_url ? (
          <img
            src={item.poster_url || item.banner_url}
            alt={item.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              // Fallback to placeholder color
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-zinc-600">
            {item.type === 'movie' && <Film className="w-10 h-10 opacity-40" />}
            {item.type === 'series' && <Tv className="w-10 h-10 opacity-40" />}
            {item.type === 'anime' && <Sparkles className="w-10 h-10 opacity-40" />}
          </div>
        )}

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />

        {/* Type Badge Top Left */}
        <div className="absolute top-2.5 left-2.5 z-10">{getTypeBadge()}</div>

        {/* Rating and Favorite Top Right */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
          {item.rating > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 text-amber-400 text-xs font-semibold">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>{item.rating.toFixed(1)}</span>
            </div>
          )}

          <button
            onClick={(e) => onToggleFavorite(item.id, e)}
            title={item.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className={`p-1.5 rounded-full backdrop-blur-md border transition-transform active:scale-90 ${
              item.favorite
                ? 'bg-rose-950/80 border-rose-700/60 text-rose-500'
                : 'bg-zinc-900/70 border-zinc-700/50 text-zinc-400 hover:text-rose-400'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${item.favorite ? 'fill-rose-500' : ''}`} />
          </button>
        </div>

        {/* Status Badge Bottom Left inside Image */}
        <div className="absolute bottom-2 left-2.5 z-10">{getStatusBadge(item.status)}</div>
      </div>

      {/* Body Information */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-zinc-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
            {item.title}
          </h3>

          {item.original_title && (
            <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5 italic">
              {item.original_title}
            </p>
          )}

          {/* Genres and Year */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {item.year && (
              <span className="text-[11px] font-medium text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                {item.year}
              </span>
            )}
            {item.genres.slice(0, 2).map((g) => (
              <span
                key={g}
                className="text-[10px] text-zinc-400 bg-zinc-800/60 px-1.5 py-0.5 rounded"
              >
                {g}
              </span>
            ))}
            {item.genres.length > 2 && (
              <span className="text-[10px] text-zinc-500">+{item.genres.length - 2}</span>
            )}
          </div>
        </div>

        {/* Progress Tracker Section */}
        <div className="mt-3.5 pt-3 border-t border-zinc-800/80">
          {isSeriesOrAnime ? (
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-zinc-400 font-medium">
                  {item.total_seasons && item.total_seasons > 1 ? (
                    <span className="text-zinc-300">
                      T{item.current_season || 1} •{' '}
                    </span>
                  ) : null}
                  Episódio <strong className="text-zinc-200">{item.episodes_watched}</strong> de{' '}
                  <span className="text-zinc-400">{item.episodes_total || '?'}</span>
                </span>
                <span className="text-[11px] font-semibold text-indigo-400">
                  {progressPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Quick Increment / Decrement Buttons */}
              <div className="flex items-center justify-between gap-1.5">
                <button
                  onClick={(e) => onDecrementEpisode(item.id, e)}
                  disabled={item.episodes_watched <= 0}
                  title="Diminuir 1 episódio"
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none text-zinc-300 hover:text-white transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleIncrement}
                  disabled={item.episodes_total > 0 && item.episodes_watched >= item.episodes_total}
                  title="Marcar mais 1 episódio assistido"
                  className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300 hover:text-white text-xs font-medium transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                  <span>+1 Ep</span>
                </button>

                {/* Quick status cycle button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextStatus: MediaStatus =
                      item.status === 'watching'
                        ? 'completed'
                        : item.status === 'completed'
                        ? 'plan_to_watch'
                        : 'watching';
                    onChangeStatus(item.id, nextStatus, e);
                  }}
                  title="Alternar status rápido"
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] font-medium transition-colors"
                >
                  Status
                </button>
              </div>
            </div>
          ) : (
            /* Movie Progress / Watch state */
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                Duração: {item.episode_duration_minutes || 120} min
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newStatus: MediaStatus = item.status === 'completed' ? 'plan_to_watch' : 'completed';
                  onChangeStatus(item.id, newStatus, e);
                  if (newStatus === 'completed') {
                    confetti({ particleCount: 50, spread: 60 });
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  item.status === 'completed'
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{item.status === 'completed' ? 'Assistido' : 'Marcar visto'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
