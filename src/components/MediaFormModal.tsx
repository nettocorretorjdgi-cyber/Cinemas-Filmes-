import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Film,
  Tv,
  Sparkles,
  Star,
  Heart,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react';
import { MediaItem, MediaType, MediaStatus, SeasonProgress } from '../types/index.ts';
import { uploadImageToSupabaseStorage, getSavedSupabaseConfig } from '../services/supabase.ts';

interface MediaFormModalProps {
  initialItem?: MediaItem | null;
  onClose: () => void;
  onSave: (item: MediaItem) => void;
}

const COMMON_GENRES = [
  'Ação',
  'Aventura',
  'Comédia',
  'Drama',
  'Fantasia',
  'Ficção Científica',
  'Mistério',
  'Romance',
  'Suspense',
  'Terror',
  'Shounen',
  'Seinen',
  'Isekai',
  'Slice of Life',
  'Sobrenatural',
  'Crime',
  'Animação',
  'Histórico',
];

const SAMPLE_POSTERS = [
  {
    label: 'Sailor Moon Cosmos ✨',
    url: '/src/assets/images/sailor_moon_cosmos_1790719091474.jpg',
    banner: '/src/assets/images/sailor_moon_banner_1790719105632.jpg',
  },
  { label: 'Anime Aventura', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80' },
  { label: 'Sci-Fi Espacial', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80' },
  { label: 'Drama / Crime', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80' },
  { label: 'Fantasia Épica', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80' },
  { label: 'Cyberpunk Neon', url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80' },
];

export const MediaFormModal: React.FC<MediaFormModalProps> = ({
  initialItem,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(initialItem);

  const [type, setType] = useState<MediaType>(initialItem?.type || 'anime');
  const [title, setTitle] = useState(initialItem?.title || '');
  const [originalTitle, setOriginalTitle] = useState(initialItem?.original_title || '');
  const [status, setStatus] = useState<MediaStatus>(initialItem?.status || 'watching');
  const [posterUrl, setPosterUrl] = useState(initialItem?.poster_url || '');
  const [bannerUrl, setBannerUrl] = useState(initialItem?.banner_url || '');
  const [rating, setRating] = useState<number>(initialItem?.rating ?? 8.5);
  const [year, setYear] = useState<number | undefined>(initialItem?.year || new Date().getFullYear());
  const [genres, setGenres] = useState<string[]>(initialItem?.genres || ['Ação', 'Fantasia']);
  const [customGenre, setCustomGenre] = useState('');
  const [episodesTotal, setEpisodesTotal] = useState<number>(
    initialItem?.episodes_total ?? (initialItem?.type === 'movie' ? 1 : 12)
  );
  const [episodesWatched, setEpisodesWatched] = useState<number>(initialItem?.episodes_watched || 0);
  const [episodeDuration, setEpisodeDuration] = useState<number>(
    initialItem?.episode_duration_minutes ?? (type === 'movie' ? 120 : type === 'series' ? 45 : 24)
  );
  const [synopsis, setSynopsis] = useState(initialItem?.synopsis || '');
  const [personalNotes, setPersonalNotes] = useState(initialItem?.personal_notes || '');
  const [favorite, setFavorite] = useState(initialItem?.favorite || false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [uploadPosterError, setUploadPosterError] = useState<string | null>(null);
  const posterFileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePosterFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPoster(true);
    setUploadPosterError(null);

    const result = await uploadImageToSupabaseStorage(file, 'posters');
    setIsUploadingPoster(false);

    if (result.url) {
      setPosterUrl(result.url);
    } else {
      setUploadPosterError(
        result.error || 'Erro ao enviar imagem. Verifique se o bucket "cinetrack-media" e as políticas de armazenamento foram executadas no Supabase.'
      );
    }
  };

  // Seasons state for Series / Anime
  const [seasons, setSeasons] = useState<SeasonProgress[]>(
    initialItem?.seasons || [
      {
        season_number: 1,
        name: 'Temporada 1',
        episodes_count: initialItem?.type === 'movie' ? 1 : 12,
        episodes_watched: initialItem?.episodes_watched || 0,
      },
    ]
  );

  // Update default duration when switching types (if user hasn't explicitly customized)
  const handleTypeChange = (newType: MediaType) => {
    setType(newType);
    if (!initialItem) {
      if (newType === 'movie') {
        setEpisodesTotal(1);
        setEpisodesWatched(status === 'completed' ? 1 : 0);
        setEpisodeDuration(120);
      } else if (newType === 'anime') {
        setEpisodesTotal(12);
        setEpisodeDuration(24);
      } else {
        setEpisodesTotal(10);
        setEpisodeDuration(50);
      }
    }
  };

  const handleToggleGenre = (g: string) => {
    if (genres.includes(g)) {
      setGenres(genres.filter((item) => item !== g));
    } else {
      setGenres([...genres, g]);
    }
  };

  const handleAddCustomGenre = () => {
    const trimmed = customGenre.trim();
    if (trimmed && !genres.includes(trimmed)) {
      setGenres([...genres, trimmed]);
      setCustomGenre('');
    }
  };

  // Seasons helpers
  const handleAddSeason = () => {
    const nextSeasonNum = seasons.length + 1;
    const newSeason: SeasonProgress = {
      season_number: nextSeasonNum,
      name: `Temporada ${nextSeasonNum}`,
      episodes_count: 12,
      episodes_watched: 0,
    };
    const updated = [...seasons, newSeason];
    setSeasons(updated);
    setEpisodesTotal(updated.reduce((sum, s) => sum + s.episodes_count, 0));
  };

  const handleRemoveSeason = (idx: number) => {
    const updated = seasons.filter((_, i) => i !== idx);
    setSeasons(updated);
    setEpisodesTotal(updated.reduce((sum, s) => sum + s.episodes_count, 0));
  };

  const handleSeasonEpisodesChange = (idx: number, count: number) => {
    const updated = [...seasons];
    updated[idx] = {
      ...updated[idx],
      episodes_count: Math.max(1, count),
    };
    setSeasons(updated);
    setEpisodesTotal(updated.reduce((sum, s) => sum + s.episodes_count, 0));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor, informe o título.');
      return;
    }

    // Auto calculate episodes watched based on seasons if applicable
    const finalWatched = Math.min(episodesWatched, episodesTotal);

    const item: MediaItem = {
      id: initialItem?.id || `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: title.trim(),
      original_title: originalTitle.trim() || undefined,
      type,
      status,
      poster_url: posterUrl.trim() || undefined,
      banner_url: bannerUrl.trim() || undefined,
      rating: Number(rating),
      genres,
      year: year ? Number(year) : undefined,
      episodes_total: Number(episodesTotal),
      episodes_watched: Number(finalWatched),
      episode_duration_minutes: Number(episodeDuration),
      total_seasons: type !== 'movie' ? seasons.length : 1,
      current_season: 1,
      synopsis: synopsis.trim() || undefined,
      personal_notes: personalNotes.trim() || undefined,
      favorite,
      seasons: type !== 'movie' ? seasons : undefined,
      created_at: initialItem?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave(item);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              {type === 'movie' && <Film className="w-5 h-5" />}
              {type === 'series' && <Tv className="w-5 h-5" />}
              {type === 'anime' && <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">
                {isEditing ? 'Editar Título' : 'Adicionar Novo Título'}
              </h2>
              <p className="text-xs text-zinc-400">
                Gerencie catálogo e progresso de episódios
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Tipo de Conteúdo
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('movie')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  type === 'movie'
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/40'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Film className="w-4 h-4" /> Filme
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('series')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  type === 'series'
                    ? 'bg-indigo-950/50 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-950/40'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Tv className="w-4 h-4" /> Série
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('anime')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  type === 'anime'
                    ? 'bg-amber-950/50 border-amber-500 text-amber-300 shadow-md shadow-amber-950/40'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Sparkles className="w-4 h-4" /> Anime
              </button>
            </div>
          </div>

          {/* 2. Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Título Principal (PT-BR) *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Frieren, Breaking Bad, Interestelar..."
                className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Título Original (Opcional)
              </label>
              <input
                type="text"
                value={originalTitle}
                onChange={(e) => setOriginalTitle(e.target.value)}
                placeholder="Ex: 葬送のフリーレン, Interstellar..."
                className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 3. Status, Rating, Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MediaStatus)}
                className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="watching">Assistindo</option>
                <option value="plan_to_watch">Quero Assistir</option>
                <option value="completed">Concluído</option>
                <option value="on_hold">Pausado</option>
                <option value="dropped">Abandonado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Nota Pessoal (0 a 10)</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> {rating}
                </span>
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Ano de Lançamento
              </label>
              <input
                type="number"
                min="1900"
                max="2099"
                value={year || ''}
                onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Ex: 2024"
                className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 4. Episode Progress Controls */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Tv className="w-4 h-4" />
              Controle de Progresso de Episódios
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Episódios Assistidos
                </label>
                <input
                  type="number"
                  min="0"
                  max={episodesTotal || 9999}
                  value={episodesWatched}
                  onChange={(e) => setEpisodesWatched(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Total de Episódios
                </label>
                <input
                  type="number"
                  min="1"
                  value={episodesTotal}
                  onChange={(e) => setEpisodesTotal(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Duração média (minutos)
                </label>
                <input
                  type="number"
                  min="1"
                  value={episodeDuration}
                  onChange={(e) => setEpisodeDuration(parseInt(e.target.value) || 24)}
                  className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Seasons Configuration for Series / Anime */}
            {type !== 'movie' && (
              <div className="pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-300">
                    Temporadas ({seasons.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddSeason}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Temporada
                  </button>
                </div>

                <div className="space-y-2">
                  {seasons.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800 text-xs"
                    >
                      <span className="font-semibold text-zinc-300 w-24">
                        {s.name || `Temp ${s.season_number}`}
                      </span>
                      <span className="text-zinc-500">Episódios:</span>
                      <input
                        type="number"
                        min="1"
                        value={s.episodes_count}
                        onChange={(e) =>
                          handleSeasonEpisodesChange(idx, parseInt(e.target.value) || 1)
                        }
                        className="w-16 px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-center text-zinc-200"
                      />
                      {seasons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSeason(idx)}
                          className="p-1 text-zinc-500 hover:text-rose-400 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. Posters and Images */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Poster / Capa
                  </label>
                  <button
                    type="button"
                    onClick={() => posterFileInputRef.current?.click()}
                    disabled={isUploadingPoster}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors disabled:opacity-50"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isUploadingPoster ? 'Enviando...' : 'Enviar Imagem'}</span>
                  </button>
                  <input
                    ref={posterFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePosterFileUpload}
                    className="hidden"
                  />
                </div>
                <input
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://exemplo.com/poster.jpg ou use o botão de Upload"
                  className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
                {uploadPosterError && (
                  <p className="text-[11px] text-rose-400 mt-1">{uploadPosterError}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  URL do Banner Horizontal (Opcional)
                </label>
                <input
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://exemplo.com/banner.jpg"
                  className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Quick Poster presets for testing */}
            <div>
              <span className="text-[11px] text-zinc-500 block mb-1.5">
                Ou escolha uma capa rápida de demonstração:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_POSTERS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => {
                      setPosterUrl(s.url);
                      setBannerUrl(('banner' in s ? s.banner : s.url) as string);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Genres Tag Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Gêneros / Categorias
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {COMMON_GENRES.map((g) => {
                const isSelected = genres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleToggleGenre(g)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white font-medium shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="text"
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                placeholder="Adicionar outro gênero..."
                className="flex-1 px-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomGenre();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomGenre}
                className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium"
              >
                + Adicionar
              </button>
            </div>
          </div>

          {/* 7. Synopsis & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Sinopse
              </label>
              <textarea
                rows={3}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Breve resumo da trama..."
                className="w-full p-3 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Minhas Anotações & Crítica
              </label>
              <textarea
                rows={3}
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                placeholder="Sua opinião, review pessoal ou lembretes..."
                className="w-full p-3 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 8. Favorite Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setFavorite(!favorite)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                favorite
                  ? 'bg-rose-950/60 border-rose-600 text-rose-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{favorite ? 'Favoritado ❤️' : 'Marcar como Favorito'}</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.01]"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Título</span>
          </button>
        </div>
      </div>
    </div>
  );
};
