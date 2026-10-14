import React, { useState, useEffect, useMemo } from 'react';
import {
  Film,
  Tv,
  Sparkles,
  Plus,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MediaItem, MediaType, MediaStatus } from './types/index.ts';
import {
  loadAllMedia,
  persistMediaItem,
  removeMediaItem,
} from './services/storage.ts';
import { Navbar } from './components/Navbar.tsx';
import { FilterBar, SortOption } from './components/FilterBar.tsx';
import { MediaCard } from './components/MediaCard.tsx';
import { MediaDetailModal } from './components/MediaDetailModal.tsx';
import { MediaFormModal } from './components/MediaFormModal.tsx';
import { StatsModal } from './components/StatsModal.tsx';

export default function App() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter and Search states
  const [currentType, setCurrentType] = useState<MediaType | 'all'>('all');
  const [currentStatus, setCurrentStatus] = useState<MediaStatus | 'all' | 'favorites'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentSort, setCurrentSort] = useState<SortOption>('updated_desc');

  // Modals state
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<MediaItem | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<MediaItem | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // Load items on mount
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const { items: loadedItems } = await loadAllMedia();
      setItems(loadedItems);
      setIsLoading(false);
    }
    init();
  }, []);

  // Update detail modal item when items list updates
  useEffect(() => {
    if (selectedItemForDetail) {
      const fresh = items.find((i) => i.id === selectedItemForDetail.id);
      if (fresh) {
        setSelectedItemForDetail(fresh);
      }
    }
  }, [items]);

  // Dynamic genres list
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    items.forEach((item) => {
      item.genres?.forEach((g) => genreSet.add(g));
    });
    return Array.from(genreSet).sort();
  }, [items]);

  // Counts for navbar & filter bar
  const counts = useMemo(() => {
    return {
      all: items.length,
      movie: items.filter((i) => i.type === 'movie').length,
      series: items.filter((i) => i.type === 'series').length,
      anime: items.filter((i) => i.type === 'anime').length,
    };
  }, [items]);

  const statusCounts = useMemo(() => {
    // Filtered by currentType if not 'all'
    const typeFiltered = currentType === 'all' ? items : items.filter((i) => i.type === currentType);
    return {
      all: typeFiltered.length,
      watching: typeFiltered.filter((i) => i.status === 'watching').length,
      plan_to_watch: typeFiltered.filter((i) => i.status === 'plan_to_watch').length,
      completed: typeFiltered.filter((i) => i.status === 'completed').length,
      on_hold: typeFiltered.filter((i) => i.status === 'on_hold').length,
      dropped: typeFiltered.filter((i) => i.status === 'dropped').length,
      favorites: typeFiltered.filter((i) => i.favorite).length,
    };
  }, [items, currentType]);

  // Filtered and Sorted items
  const displayedItems = useMemo(() => {
    return items
      .filter((item) => {
        // Type filter
        if (currentType !== 'all' && item.type !== currentType) {
          return false;
        }

        // Status filter
        if (currentStatus === 'favorites') {
          if (!item.favorite) return false;
        } else if (currentStatus !== 'all' && item.status !== currentStatus) {
          return false;
        }

        // Genre filter
        if (selectedGenre !== 'all' && !item.genres.includes(selectedGenre)) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesTitle = item.title.toLowerCase().includes(q);
          const matchesOriginal = item.original_title?.toLowerCase().includes(q);
          const matchesGenre = item.genres.some((g) => g.toLowerCase().includes(q));
          const matchesYear = item.year?.toString().includes(q);
          const matchesSynopsis = item.synopsis?.toLowerCase().includes(q);
          if (!matchesTitle && !matchesOriginal && !matchesGenre && !matchesYear && !matchesSynopsis) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (currentSort) {
          case 'rating_desc':
            return (b.rating || 0) - (a.rating || 0);
          case 'title_asc':
            return a.title.localeCompare(b.title, 'pt-BR');
          case 'progress_desc': {
            const progA = a.episodes_total > 0 ? a.episodes_watched / a.episodes_total : 0;
            const progB = b.episodes_total > 0 ? b.episodes_watched / b.episodes_total : 0;
            return progB - progA;
          }
          case 'year_desc':
            return (b.year || 0) - (a.year || 0);
          case 'updated_desc':
          default:
            return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        }
      });
  }, [items, currentType, currentStatus, selectedGenre, searchQuery, currentSort]);

  // Item Action Handlers
  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const updated = { ...item, favorite: !item.favorite };
    const newList = await persistMediaItem(updated, items);
    setItems(newList);
  };

  const handleIncrementEpisode = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const nextWatched = Math.min((item.episodes_total || 9999), item.episodes_watched + 1);
    const isNowFinished = item.episodes_total > 0 && nextWatched >= item.episodes_total;

    const updated: MediaItem = {
      ...item,
      episodes_watched: nextWatched,
      status: isNowFinished ? 'completed' : item.status,
    };

    const newList = await persistMediaItem(updated, items);
    setItems(newList);
  };

  const handleDecrementEpisode = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = items.find((i) => i.id === id);
    if (!item || item.episodes_watched <= 0) return;

    const updated: MediaItem = {
      ...item,
      episodes_watched: item.episodes_watched - 1,
    };

    const newList = await persistMediaItem(updated, items);
    setItems(newList);
  };

  const handleChangeStatus = async (id: string, newStatus: MediaStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const updated: MediaItem = {
      ...item,
      status: newStatus,
      episodes_watched:
        newStatus === 'completed' && item.episodes_total > 0 ? item.episodes_total : item.episodes_watched,
    };

    const newList = await persistMediaItem(updated, items);
    setItems(newList);
  };

  const handleSaveItem = async (savedItem: MediaItem) => {
    const newList = await persistMediaItem(savedItem, items);
    setItems(newList);
    setIsFormModalOpen(false);
    setItemToEdit(null);

    // If detail modal was open for this item, keep it updated
    if (selectedItemForDetail && selectedItemForDetail.id === savedItem.id) {
      setSelectedItemForDetail(savedItem);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const newList = await removeMediaItem(id, items);
    setItems(newList);
    if (selectedItemForDetail && selectedItemForDetail.id === id) {
      setSelectedItemForDetail(null);
    }
  };

  const handleOpenEdit = (item: MediaItem) => {
    setItemToEdit(item);
    setIsFormModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentType={currentType}
        onSelectType={(t) => {
          setCurrentType(t);
          setCurrentStatus('all');
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNewModal={() => {
          setItemToEdit(null);
          setIsFormModalOpen(true);
        }}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
        counts={counts}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter Bar (Status, Genres, Sort) */}
        <FilterBar
          currentStatus={currentStatus}
          onSelectStatus={setCurrentStatus}
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
          availableGenres={availableGenres}
          currentSort={currentSort}
          onSelectSort={setCurrentSort}
          statusCounts={statusCounts}
        />

        {/* Media Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs">Carregando catálogo...</span>
          </div>
        ) : displayedItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {displayedItems.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                onClick={() => setSelectedItemForDetail(item)}
                onToggleFavorite={handleToggleFavorite}
                onIncrementEpisode={handleIncrementEpisode}
                onDecrementEpisode={handleDecrementEpisode}
                onChangeStatus={handleChangeStatus}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="py-16 px-4 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/60 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-200">
              Nenhum título encontrado
            </h3>
            <p className="text-xs text-zinc-400 mt-1 mb-4">
              {searchQuery || selectedGenre !== 'all' || currentStatus !== 'all'
                ? 'Tente remover os filtros ou buscar por outro termo.'
                : 'Sua lista está vazia no momento.'}
            </p>
            <div className="flex items-center justify-center gap-2">
              {(searchQuery || selectedGenre !== 'all' || currentStatus !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGenre('all');
                    setCurrentStatus('all');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                >
                  Limpar Filtros
                </button>
              )}
              <button
                onClick={() => {
                  setItemToEdit(null);
                  setIsFormModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Título
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {/* 1. Detail Modal with interactive episodes tracker */}
      {selectedItemForDetail && (
        <MediaDetailModal
          item={selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
          onEdit={(item) => {
            setSelectedItemForDetail(null);
            handleOpenEdit(item);
          }}
          onDelete={handleDeleteItem}
          onUpdateItem={async (updated) => {
            const newList = await persistMediaItem(updated, items);
            setItems(newList);
            setSelectedItemForDetail(updated);
          }}
        />
      )}

      {/* 2. Add/Edit Form Modal */}
      {isFormModalOpen && (
        <MediaFormModal
          initialItem={itemToEdit}
          onClose={() => {
            setIsFormModalOpen(false);
            setItemToEdit(null);
          }}
          onSave={handleSaveItem}
        />
      )}

      {/* 3. Statistics Dashboard Modal */}
      {isStatsModalOpen && (
        <StatsModal items={items} onClose={() => setIsStatsModalOpen(false)} />
      )}
    </div>
  );
}
