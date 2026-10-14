import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MediaItem, SupabaseConfig } from '../types/index.ts';

const SUPABASE_STORAGE_KEY = 'cinetrack_supabase_config';

export function getSavedSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading Supabase config from localStorage:', e);
  }

  // Fallback to Vite environment variables if available
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  return {
    url: envUrl,
    anonKey: envKey,
    isConnected: false,
  };
}

export function saveSupabaseConfig(config: { url: string; anonKey: string }): void {
  const current = getSavedSupabaseConfig();
  const updated: SupabaseConfig = {
    ...current,
    url: config.url.trim(),
    anonKey: config.anonKey.trim(),
  };
  localStorage.setItem(SUPABASE_STORAGE_KEY, JSON.stringify(updated));
  // Invalidate cached client
  cachedClient = null;
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(SUPABASE_STORAGE_KEY);
  cachedClient = null;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSavedSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  if (cachedClient) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return cachedClient;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{
  success: boolean;
  message: string;
  tableExists: boolean;
}> {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  if (!cleanUrl || !cleanKey) {
    return {
      success: false,
      message: 'URL e Chave Anônima (anon key) são obrigatórias.',
      tableExists: false,
    };
  }

  try {
    const tempClient = createClient(cleanUrl, cleanKey);
    // Attempt a light query on the media_items table
    const { data, error } = await tempClient
      .from('media_items')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('relation "public.media_items" does not exist')) {
        return {
          success: true,
          message: 'Conectado com sucesso ao Supabase! A tabela "media_items" ainda não foi criada. Use o script SQL fornecido abaixo para criá-la.',
          tableExists: false,
        };
      }
      // If error is about API key or URL
      return {
        success: false,
        message: `Falha na conexão: ${error.message} (Código: ${error.code || 'Desconhecido'})`,
        tableExists: false,
      };
    }

    return {
      success: true,
      message: 'Conexão estabelecida com sucesso! A tabela "media_items" está configurada e pronta.',
      tableExists: true,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Erro ao conectar: ${errMsg}`,
      tableExists: false,
    };
  }
}

export async function fetchMediaFromSupabase(): Promise<MediaItem[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('media_items')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error:', error);
      return null;
    }

    if (data) {
      // Map and ensure field formats
      return data.map((item) => ({
        ...item,
        genres: Array.isArray(item.genres) ? item.genres : (typeof item.genres === 'string' ? JSON.parse(item.genres) : []),
        seasons: Array.isArray(item.seasons) ? item.seasons : (typeof item.seasons === 'string' ? JSON.parse(item.seasons) : []),
        favorite: Boolean(item.favorite),
      }));
    }
    return [];
  } catch (err) {
    console.error('Error in fetchMediaFromSupabase:', err);
    return null;
  }
}

export async function upsertMediaToSupabase(item: MediaItem): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: item.id,
      title: item.title,
      original_title: item.original_title || null,
      type: item.type,
      status: item.status,
      poster_url: item.poster_url || null,
      banner_url: item.banner_url || null,
      rating: item.rating ?? 0,
      genres: item.genres || [],
      year: item.year || null,
      episodes_total: item.episodes_total || 0,
      episodes_watched: item.episodes_watched || 0,
      episode_duration_minutes: item.episode_duration_minutes || 24,
      total_seasons: item.total_seasons || 1,
      current_season: item.current_season || 1,
      synopsis: item.synopsis || null,
      personal_notes: item.personal_notes || null,
      favorite: item.favorite || false,
      start_date: item.start_date || null,
      finish_date: item.finish_date || null,
      seasons: item.seasons || [],
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('media_items')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Supabase upsert error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in upsertMediaToSupabase:', err);
    return false;
  }
}

export async function deleteMediaFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('media_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in deleteMediaFromSupabase:', err);
    return false;
  }
}

export async function syncLocalItemsToSupabase(items: MediaItem[]): Promise<{
  success: boolean;
  insertedCount: number;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, insertedCount: 0, error: 'Cliente Supabase não configurado' };
  }

  try {
    const payloads = items.map((item) => ({
      id: item.id,
      title: item.title,
      original_title: item.original_title || null,
      type: item.type,
      status: item.status,
      poster_url: item.poster_url || null,
      banner_url: item.banner_url || null,
      rating: item.rating ?? 0,
      genres: item.genres || [],
      year: item.year || null,
      episodes_total: item.episodes_total || 0,
      episodes_watched: item.episodes_watched || 0,
      episode_duration_minutes: item.episode_duration_minutes || 24,
      total_seasons: item.total_seasons || 1,
      current_season: item.current_season || 1,
      synopsis: item.synopsis || null,
      personal_notes: item.personal_notes || null,
      favorite: item.favorite || false,
      start_date: item.start_date || null,
      finish_date: item.finish_date || null,
      seasons: item.seasons || [],
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client
      .from('media_items')
      .upsert(payloads, { onConflict: 'id' });

    if (error) {
      return { success: false, insertedCount: 0, error: error.message };
    }

    return { success: true, insertedCount: items.length };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, insertedCount: 0, error: errMsg };
  }
}

export async function uploadImageToSupabaseStorage(
  file: File,
  folder: 'posters' | 'banners' = 'posters'
): Promise<{ url: string | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { url: null, error: 'Supabase não conectado. Configure a URL e Chave Anon.' };
  }

  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const { error: uploadError } = await client.storage
      .from('cinetrack-media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { url: null, error: uploadError.message };
    }

    const { data } = client.storage.from('cinetrack-media').getPublicUrl(fileName);
    return { url: data.publicUrl, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { url: null, error: msg };
  }
}

export const SUPABASE_STORAGE_POLICIES_SQL = `-- ============================================================================
-- POLÍTICAS DE ARMAZENAMENTO SALVAS (SUPABASE STORAGE: BUCKETS & OBJECTS)
-- ============================================================================

-- 1. Criação do Bucket de Armazenamento 'cinetrack-media'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'cinetrack-media',
    'cinetrack-media',
    TRUE,
    10485760, -- Limite de 10 MB por imagem
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

-- 2. Limpar políticas antigas do bucket 'cinetrack-media' se existirem
DROP POLICY IF EXISTS "Visualização pública de imagens do CineTrack" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de capas no CineTrack" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de capas no CineTrack" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de capas no CineTrack" ON storage.objects;

-- 3. POLÍTICA DE LEITURA (SELECT): Qualquer visitante pode ver capas e banners
CREATE POLICY "Visualização pública de imagens do CineTrack"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'cinetrack-media');

-- 4. POLÍTICA DE ENVIO (INSERT): Permite enviar imagens para o bucket
CREATE POLICY "Permitir upload de capas no CineTrack"
    ON storage.objects
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        bucket_id = 'cinetrack-media'
        AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'))
    );

-- 5. POLÍTICA DE ATUALIZAÇÃO (UPDATE): Permite alterar/sobrescrever imagens
CREATE POLICY "Permitir atualização de capas no CineTrack"
    ON storage.objects
    FOR UPDATE
    TO anon, authenticated
    USING (bucket_id = 'cinetrack-media')
    WITH CHECK (bucket_id = 'cinetrack-media');

-- 6. POLÍTICA DE EXCLUSÃO (DELETE): Permite remover imagens
CREATE POLICY "Permitir exclusão de capas no CineTrack"
    ON storage.objects
    FOR DELETE
    TO anon, authenticated
    USING (bucket_id = 'cinetrack-media');
`;

export const SUPABASE_DATABASE_POLICIES_SQL = `-- ============================================================================
-- POLÍTICAS DE SEGURANÇA E BANCO DE DADOS (RLS - media_items)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.media_items (
    id TEXT PRIMARY KEY,
    user_id UUID DEFAULT auth.uid(),
    title TEXT NOT NULL,
    original_title TEXT,
    type TEXT NOT NULL CHECK (type IN ('movie', 'series', 'anime')),
    status TEXT NOT NULL CHECK (status IN ('watching', 'plan_to_watch', 'completed', 'on_hold', 'dropped')),
    poster_url TEXT,
    banner_url TEXT,
    rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 10),
    genres JSONB DEFAULT '[]'::jsonb,
    year INTEGER,
    episodes_total INTEGER DEFAULT 1,
    episodes_watched INTEGER DEFAULT 0,
    episode_duration_minutes INTEGER DEFAULT 24,
    total_seasons INTEGER DEFAULT 1,
    current_season INTEGER DEFAULT 1,
    synopsis TEXT,
    personal_notes TEXT,
    favorite BOOLEAN DEFAULT FALSE,
    start_date DATE,
    finish_date DATE,
    seasons JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas
DROP POLICY IF EXISTS "Permitir leitura para anon e autenticados" ON public.media_items;
DROP POLICY IF EXISTS "Permitir insercao para anon e autenticados" ON public.media_items;
DROP POLICY IF EXISTS "Permitir atualizacao para anon e autenticados" ON public.media_items;
DROP POLICY IF EXISTS "Permitir exclusao para anon e autenticados" ON public.media_items;

-- Políticas universais de banco
CREATE POLICY "Permitir leitura para anon e autenticados"
    ON public.media_items FOR SELECT TO anon, authenticated
    USING (user_id IS NULL OR user_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Permitir insercao para anon e autenticados"
    ON public.media_items FOR INSERT TO anon, authenticated
    WITH CHECK (user_id IS NULL OR user_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Permitir atualizacao para anon e autenticados"
    ON public.media_items FOR UPDATE TO anon, authenticated
    USING (user_id IS NULL OR user_id = auth.uid() OR auth.uid() IS NULL)
    WITH CHECK (user_id IS NULL OR user_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Permitir exclusao para anon e autenticados"
    ON public.media_items FOR DELETE TO anon, authenticated
    USING (user_id IS NULL OR user_id = auth.uid() OR auth.uid() IS NULL);

CREATE INDEX IF NOT EXISTS idx_media_items_type ON public.media_items(type);
CREATE INDEX IF NOT EXISTS idx_media_items_status ON public.media_items(status);
CREATE INDEX IF NOT EXISTS idx_media_items_favorite ON public.media_items(favorite);
CREATE INDEX IF NOT EXISTS idx_media_items_updated_at ON public.media_items(updated_at DESC);
`;

export const SUPABASE_SQL_SCRIPT = `-- ============================================================================
-- CINETRACK: SCRIPT SQL COMPLETO (BANCO DE DADOS + POLÍTICAS DE ARMAZENAMENTO)
-- Execute no SQL Editor do Supabase: https://supabase.com/dashboard/project/_/sql
-- ============================================================================

${SUPABASE_DATABASE_POLICIES_SQL}

${SUPABASE_STORAGE_POLICIES_SQL}
`;
