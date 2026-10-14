import React, { useState } from 'react';
import {
  X,
  Star,
  Heart,
  Calendar,
  Clock,
  Film,
  Tv,
  Sparkles,
  Edit,
  Trash2,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  XCircle,
  Check,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MediaItem, MediaStatus, SeasonProgress } from '../types/index.ts';

interface MediaDetailModalProps {
  item: MediaItem;
  onClose: () => void;
  onEdit: (item: MediaItem) => void;
  onDelete: (id: string) => void;
  onUpdateItem: (item: MediaItem) => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  item,
  onClose,
  onEdit,
  onDelete,
  onUpdateItem,
}) => {
  const [activeSeasonIndex, setActiveSeasonIndex] = useState(0);
  const [personalNotes, setPersonalNotes] = useState(item.personal_notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const isSeriesOrAnime = item.type === 'series' || item.type === 'anime';

  // Ensure seasons exist; if not, synthesize a default season
  const seasons: SeasonProgress[] =
    item.seasons && item.seasons.length > 0
      ? item.seasons
      : [
          {
            season_number: 1,
            name: 'Temporada 1',
            episodes_count: item.episodes_total || 12,
            episodes_watched: item.episodes_watched || 0,
            episodes: Array.from({ length: item.episodes_total || 12 }, (_, i) => ({
              episode_number: i + 1,
              title: `Episódio ${i + 1}`,
              watched: i + 1 <= item.episodes_watched,
            })),
          },
        ];

  const currentSeason = seasons[activeSeasonIndex] || seasons[0];

  // Calculate estimated total watch time
  const totalMinutesWatched = item.episodes_watched * (item.episode_duration_minutes || 24);
  const hoursWatched = Math.floor(totalMinutesWatched / 60);
  const remainingMinutes = totalMinutesWatched % 60;

  const handleToggleEpisode = (seasonIdx: number, epNumber: number) => {
    const updatedSeasons = [...seasons];
    const targetSeason = { ...updatedSeasons[seasonIdx] };

    // Ensure episodes array exists
    let episodesList = targetSeason.episodes
      ? [...targetSeason.episodes]
      : Array.from({ length: targetSeason.episodes_count }, (_, i) => ({
          episode_number: i + 1,
          title: `Episódio ${i + 1}`,
          watched: i + 1 <= targetSeason.episodes_watched,
        }));

    const epIdx = episodesList.findIndex((ep) => ep.episode_number === epNumber);
    if (epIdx >= 0) {
      const isNowWatched = !episodesList[epIdx].watched;
      episodesList[epIdx] = {
        ...episodesList[epIdx],
        watched: isNowWatched,
        watched_at: isNowWatched ? new Date().toISOString().split('T')[0] : undefined,
      };
    } else {
      episodesList.push({
        episode_number: epNumber,
        title: `Episódio ${epNumber}`,
        watched: true,
        watched_at: new Date().toISOString().split('T')[0],
      });
    }

    targetSeason.episodes = episodesList;
    targetSeason.episodes_watched = episodesList.filter((e) => e.watched).length;
    updatedSeasons[seasonIdx] = targetSeason;

    // Recalculate total watched episodes across all seasons
    const newTotalWatched = updatedSeasons.reduce((acc, s) => acc + s.episodes_watched, 0);

    const isNowAllCompleted =
      item.episodes_total > 0 && newTotalWatched >= item.episodes_total;

    if (isNowAllCompleted && item.status !== 'completed') {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }

    onUpdateItem({
      ...item,
      seasons: updatedSeasons,
      episodes_watched: newTotalWatched,
      status: isNowAllCompleted ? 'completed' : item.status,
    });
  };

  const handleToggleWholeSeason = (seasonIdx: number, markWatched: boolean) => {
    const updatedSeasons = [...seasons];
    const targetSeason = { ...updatedSeasons[seasonIdx] };

    const episodesList = Array.from({ length: targetSeason.episodes_count }, (_, i) => ({
      episode_number: i + 1,
      title: `Episódio ${i + 1}`,
      watched: markWatched,
      watched_at: markWatched ? new Date().toISOString().split('T')[0] : undefined,
    }));

    targetSeason.episodes = episodesList;
    targetSeason.episodes_watched = markWatched ? targetSeason.episodes_count : 0;
    updatedSeasons[seasonIdx] = targetSeason;

    const newTotalWatched = updatedSeasons.reduce((acc, s) => acc + s.episodes_watched, 0);

    if (markWatched) {
      confetti({ particleCount: 60, spread: 60 });
    }

    onUpdateItem({
      ...item,
      seasons: updatedSeasons,
      episodes_watched: newTotalWatched,
      status:
        item.episodes_total > 0 && newTotalWatched >= item.episodes_total
          ? 'completed'
          : item.status,
    });
  };

  const handleSaveNotes = () => {
    setIsEditingNotes(false);
    onUpdateItem({
      ...item,
      personal_notes: personalNotes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Hero Header Banner */}
        <div className="relative h-48 sm:h-64 w-full bg-zinc-950 overflow-hidden shrink-0">
          {item.banner_url || item.poster_url ? (
            <img
              src={item.banner_url || item.poster_url}
              alt={item.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Action buttons on banner */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <button
              onClick={() => onEdit(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/85 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-medium text-zinc-200 transition-colors"
            >
              <Edit className="w-3.5 h-3.5 text-indigo-400" />
              <span>Editar</span>
            </button>

            <button
              onClick={() => {
                if (confirm(`Tem certeza que deseja excluir "${item.title}"?`)) {
                  onDelete(item.id);
                  onClose();
                }
              }}
              className="p-1.5 rounded-lg bg-zinc-900/85 hover:bg-rose-950/80 border border-zinc-700/60 hover:border-rose-800/60 text-zinc-400 hover:text-rose-400 transition-colors"
              title="Excluir título"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Title and metadata on banner */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
            {/* Poster Thumbnail */}
            {item.poster_url && (
              <div className="hidden sm:block w-24 h-36 rounded-lg overflow-hidden border-2 border-zinc-700 shadow-xl shrink-0 bg-zinc-950 -mb-2">
                <img
                  src={item.poster_url}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-indigo-600 text-white">
                  {item.type === 'movie' ? 'Filme' : item.type === 'series' ? 'Série' : 'Anime'}
                </span>

                {item.year && (
                  <span className="text-xs text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded">
                    {item.year}
                  </span>
                )}

                {item.rating > 0 && (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-zinc-800/90 border border-zinc-700 px-2 py-0.5 rounded">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {item.rating.toFixed(1)} / 10
                  </span>
                )}

                {item.favorite && (
                  <span className="flex items-center gap-1 text-xs font-medium text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded">
                    <Heart className="w-3 h-3 fill-rose-500 text-rose-500" /> Favorito
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {item.title}
              </h1>
              {item.original_title && (
                <p className="text-xs sm:text-sm text-zinc-400 italic">
                  {item.original_title}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Quick Status and Time Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <div>
              <span className="text-[11px] text-zinc-500 block uppercase font-medium">Status Atual</span>
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={item.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as MediaStatus;
                    onUpdateItem({ ...item, status: newStatus });
                    if (newStatus === 'completed') {
                      confetti({ particleCount: 50 });
                    }
                  }}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="watching">Assistindo</option>
                  <option value="plan_to_watch">Quero Assistir</option>
                  <option value="completed">Concluído</option>
                  <option value="on_hold">Pausado</option>
                  <option value="dropped">Abandonado</option>
                </select>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-zinc-500 block uppercase font-medium">Progresso Total</span>
              <span className="text-sm font-bold text-zinc-100 mt-1 block">
                {item.episodes_watched} de {item.episodes_total || 0} episódios ({item.episodes_total ? Math.round((item.episodes_watched / item.episodes_total) * 100) : 0}%)
              </span>
            </div>

            <div>
              <span className="text-[11px] text-zinc-500 block uppercase font-medium">Tempo Assistido</span>
              <span className="text-sm font-semibold text-indigo-400 mt-1 block flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {hoursWatched > 0 ? `${hoursWatched}h ${remainingMinutes}m` : `${remainingMinutes}m`}
              </span>
            </div>
          </div>

          {/* Genres */}
          {item.genres && item.genres.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-zinc-400 mb-2">Gêneros</h4>
              <div className="flex flex-wrap gap-1.5">
                {item.genres.map((g) => (
                  <span
                    key={g}
                    className="text-xs font-medium px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Synopsis */}
          {item.synopsis && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-zinc-400 mb-2">Sinopse</h4>
              <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/80">
                {item.synopsis}
              </p>
            </div>
          )}

          {/* Episodes and Seasons Tracker (For Series and Animes) */}
          {isSeriesOrAnime && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h4 className="text-sm font-bold uppercase text-zinc-200 tracking-wide flex items-center gap-2">
                  <Tv className="w-4 h-4 text-indigo-400" />
                  Rastreador de Episódios
                </h4>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleWholeSeason(activeSeasonIndex, true)}
                    className="text-xs px-2.5 py-1 rounded-md bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Marcar temporada toda
                  </button>
                  <button
                    onClick={() => handleToggleWholeSeason(activeSeasonIndex, false)}
                    className="text-xs px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Desmarcar toda
                  </button>
                </div>
              </div>

              {/* Season Selection Tabs */}
              {seasons.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {seasons.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSeasonIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
                        activeSeasonIndex === idx
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                      }`}
                    >
                      <span>{s.name || `Temporada ${s.season_number}`}</span>
                      <span className="text-[10px] opacity-80">
                        ({s.episodes_watched}/{s.episodes_count})
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Current Season Progress Summary */}
              <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">
                  {currentSeason.name}: <strong>{currentSeason.episodes_watched}</strong> de {currentSeason.episodes_count} episódios assistidos
                </span>
                <span className="text-indigo-400 font-bold">
                  {currentSeason.episodes_count > 0
                    ? Math.round((currentSeason.episodes_watched / currentSeason.episodes_count) * 100)
                    : 0}%
                </span>
              </div>

              {/* Interactive Episodes Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {Array.from({ length: currentSeason.episodes_count }, (_, i) => {
                  const epNum = i + 1;
                  const epDetail = currentSeason.episodes?.find((e) => e.episode_number === epNum);
                  const isWatched = epDetail ? epDetail.watched : epNum <= currentSeason.episodes_watched;

                  return (
                    <button
                      key={epNum}
                      onClick={() => handleToggleEpisode(activeSeasonIndex, epNum)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all ${
                        isWatched
                          ? 'bg-emerald-950/60 border-emerald-600/80 text-emerald-200 shadow-sm shadow-emerald-950'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-xs font-bold">Ep {epNum}</span>
                      <div className="mt-1">
                        {isWatched ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-zinc-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Personal Review & Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase text-zinc-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Minhas Anotações & Crítica
              </h4>
              {!isEditingNotes ? (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Editar notas
                </button>
              ) : (
                <button
                  onClick={handleSaveNotes}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  Salvar
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <textarea
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                placeholder="Escreva seus pensamentos, impressões, teorias sobre o final..."
                rows={4}
                className="w-full p-3 text-sm bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <div
                onClick={() => setIsEditingNotes(true)}
                className="p-3 text-sm rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-300 cursor-pointer hover:border-zinc-700 min-h-[60px]"
              >
                {personalNotes ? (
                  <p className="whitespace-pre-wrap">{personalNotes}</p>
                ) : (
                  <span className="text-zinc-500 italic">
                    Nenhuma anotação ainda. Clique aqui para registrar seus pensamentos ou crítica.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
