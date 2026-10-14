import { MediaItem } from '../types/index.ts';
import { INITIAL_MEDIA_ITEMS } from '../data/initialData.ts';
import {
  getSupabaseClient,
  fetchMediaFromSupabase,
  upsertMediaToSupabase,
  deleteMediaFromSupabase,
} from './supabase.ts';

const LOCAL_STORAGE_KEY = 'cinetrack_media_items_v2';

export function getLocalMedia(): MediaItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem('cinetrack_media_items_v1');
    if (!raw) {
      // First time initialization: populate with rich initial data
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MEDIA_ITEMS));
      return INITIAL_MEDIA_ITEMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Ensure Sailor Moon Cosmos with the newly uploaded poster is present in the list
      const sailorMoon = INITIAL_MEDIA_ITEMS[0];
      const hasSailor = parsed.some((item) => item.id === 'anime-sailor-moon-cosmos');
      let merged = parsed;
      if (!hasSailor) {
        merged = [sailorMoon, ...parsed];
      } else {
        // Ensure its poster_url is up to date with the generated Sailor Moon Cosmos poster
        merged = parsed.map((item) =>
          item.id === 'anime-sailor-moon-cosmos'
            ? { ...item, poster_url: sailorMoon.poster_url, banner_url: sailorMoon.banner_url }
            : item
        );
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (error) {
    console.error('Failed to load local media:', error);
  }
  return INITIAL_MEDIA_ITEMS;
}

export function saveLocalMedia(items: MediaItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

/**
 * Unified loader: fetches from Supabase if connected, otherwise returns localStorage items.
 */
export async function loadAllMedia(): Promise<{ items: MediaItem[]; source: 'supabase' | 'local' }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const remote = await fetchMediaFromSupabase();
      if (remote !== null) {
        // Save copy to local storage as cache/offline backup
        saveLocalMedia(remote);
        return { items: remote, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Could not fetch from Supabase, using local data fallback:', err);
    }
  }

  return { items: getLocalMedia(), source: 'local' };
}

/**
 * Saves or updates a media item both locally and to Supabase (if connected)
 */
export async function persistMediaItem(item: MediaItem, allItems: MediaItem[]): Promise<MediaItem[]> {
  const existingIdx = allItems.findIndex((i) => i.id === item.id);
  let updatedList: MediaItem[];

  const updatedItem: MediaItem = {
    ...item,
    updated_at: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    updatedList = [...allItems];
    updatedList[existingIdx] = updatedItem;
  } else {
    updatedList = [updatedItem, ...allItems];
  }

  // Always update local cache
  saveLocalMedia(updatedList);

  // Background sync to Supabase
  const client = getSupabaseClient();
  if (client) {
    upsertMediaToSupabase(updatedItem).catch((e) => {
      console.error('Failed to sync item to Supabase:', e);
    });
  }

  return updatedList;
}

/**
 * Deletes a media item locally and on Supabase
 */
export async function removeMediaItem(id: string, allItems: MediaItem[]): Promise<MediaItem[]> {
  const updatedList = allItems.filter((i) => i.id !== id);
  saveLocalMedia(updatedList);

  const client = getSupabaseClient();
  if (client) {
    deleteMediaFromSupabase(id).catch((e) => {
      console.error('Failed to delete item from Supabase:', e);
    });
  }

  return updatedList;
}

/**
 * Exports data to a JSON download
 */
export function exportDataAsJson(items: MediaItem[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `cinetrack_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Resets local database back to default initial items
 */
export function resetToDefaultCatalog(): MediaItem[] {
  saveLocalMedia(INITIAL_MEDIA_ITEMS);
  return INITIAL_MEDIA_ITEMS;
}
