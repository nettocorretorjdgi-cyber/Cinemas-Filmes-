-- ============================================================================
-- CINETRACK: SCRIPT SQL COMPLETO PARA SUPABASE
-- Inclui:
--   1. Tabela Principal (media_items) com Índices e Gatilhos
--   2. Políticas de Segurança em Nível de Linha (RLS - Row Level Security)
--   3. Criação de Bucket de Armazenamento (Supabase Storage: 'cinetrack-media')
--   4. Políticas de Armazenamento para Uploads e Leitura de Imagens (storage.objects)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PARTE 1: TABELA PRINCIPAL 'media_items'
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.media_items (
    id TEXT PRIMARY KEY,
    user_id UUID DEFAULT auth.uid(), -- Vincula ao usuário autenticado (se houver)
    title TEXT NOT NULL,
    original_title TEXT,
    type TEXT NOT NULL CHECK (type IN ('movie', 'series', 'anime')),
    status TEXT NOT NULL CHECK (status IN ('watching', 'plan_to_watch', 'completed', 'on_hold', 'dropped')),
    poster_url TEXT,
    banner_url TEXT,
    rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 10),
    genres JSONB DEFAULT '[]'::jsonb,
    year INTEGER,
    episodes_total INTEGER DEFAULT 1 CHECK (episodes_total >= 0),
    episodes_watched INTEGER DEFAULT 0 CHECK (episodes_watched >= 0),
    episode_duration_minutes INTEGER DEFAULT 24 CHECK (episode_duration_minutes >= 0),
    total_seasons INTEGER DEFAULT 1,
    current_season INTEGER DEFAULT 1,
    synopsis TEXT,
    personal_notes TEXT,
    favorite BOOLEAN DEFAULT FALSE,
    start_date DATE,
    finish_date DATE,
    seasons JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices de alta performance para ordenação e filtros comuns
CREATE INDEX IF NOT EXISTS idx_media_items_user_id ON public.media_items(user_id);
CREATE INDEX IF NOT EXISTS idx_media_items_type ON public.media_items(type);
CREATE INDEX IF NOT EXISTS idx_media_items_status ON public.media_items(status);
CREATE INDEX IF NOT EXISTS idx_media_items_favorite ON public.media_items(favorite);
CREATE INDEX IF NOT EXISTS idx_media_items_updated_at ON public.media_items(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_items_rating ON public.media_items(rating DESC);

-- Trigger para atualizar automaticamente o campo 'updated_at' em cada alteração
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_media_items_updated_at ON public.media_items;
CREATE TRIGGER trigger_media_items_updated_at
    BEFORE UPDATE ON public.media_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- PARTE 2: POLÍTICAS DE BANCO DE DADOS (RLS - ROW LEVEL SECURITY)
-- ----------------------------------------------------------------------------

-- Habilitar RLS na tabela
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura para anon e autenticados" ON public.media_items;
DROP POLICY IF EXISTS "Permitir insercao para anon e autenticados" ON public.media_items;
DROP POLICY IF EXISTS "Permitir atualizacao para anon e autenticados" ON public.media_items;
DROP POLICY IF EXISTS "Permitir exclusao para anon e autenticados" ON public.media_items;
DROP POLICY IF EXISTS "Acesso completo aos proprios itens autenticados" ON public.media_items;

-- 2.1 Políticas Universais (Suporta tanto uso com a Anon Key quanto com autenticação)
CREATE POLICY "Permitir leitura para anon e autenticados"
    ON public.media_items
    FOR SELECT
    TO anon, authenticated
    USING (
        user_id IS NULL 
        OR user_id = auth.uid() 
        OR auth.uid() IS NULL
    );

CREATE POLICY "Permitir insercao para anon e autenticados"
    ON public.media_items
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        user_id IS NULL 
        OR user_id = auth.uid() 
        OR auth.uid() IS NULL
    );

CREATE POLICY "Permitir atualizacao para anon e autenticados"
    ON public.media_items
    FOR UPDATE
    TO anon, authenticated
    USING (
        user_id IS NULL 
        OR user_id = auth.uid() 
        OR auth.uid() IS NULL
    )
    WITH CHECK (
        user_id IS NULL 
        OR user_id = auth.uid() 
        OR auth.uid() IS NULL
    );

CREATE POLICY "Permitir exclusao para anon e autenticados"
    ON public.media_items
    FOR DELETE
    TO anon, authenticated
    USING (
        user_id IS NULL 
        OR user_id = auth.uid() 
        OR auth.uid() IS NULL
    );


-- ----------------------------------------------------------------------------
-- PARTE 3: CRIAÇÃO DO BUCKET DE ARMAZENAMENTO (SUPABASE STORAGE)
-- ----------------------------------------------------------------------------

-- Criação do Bucket 'cinetrack-media' para armazenar capas, pôsteres e banners
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'cinetrack-media',
    'cinetrack-media',
    TRUE,                 -- Bucket público para exibição rápida das capas
    10485760,             -- Limite de 10MB por arquivo
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];


-- ----------------------------------------------------------------------------
-- PARTE 4: POLÍTICAS DE ARMAZENAMENTO SALVAS (STORAGE RLS POLICIES)
-- ----------------------------------------------------------------------------

-- Limpar políticas antigas do bucket 'cinetrack-media' para evitar duplicações
DROP POLICY IF EXISTS "Visualização pública de imagens do CineTrack" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de capas no CineTrack" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de capas no CineTrack" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de capas no CineTrack" ON storage.objects;

-- 4.1 Política de Leitura/Download: Qualquer usuário ou visitante pode visualizar as capas
CREATE POLICY "Visualização pública de imagens do CineTrack"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'cinetrack-media');

-- 4.2 Política de Upload: Permite upload de imagens no bucket 'cinetrack-media'
CREATE POLICY "Permitir upload de capas no CineTrack"
    ON storage.objects
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        bucket_id = 'cinetrack-media'
        AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'))
    );

-- 4.3 Política de Atualização: Permite substituir imagens existentes
CREATE POLICY "Permitir atualização de capas no CineTrack"
    ON storage.objects
    FOR UPDATE
    TO anon, authenticated
    USING (bucket_id = 'cinetrack-media')
    WITH CHECK (bucket_id = 'cinetrack-media');

-- 4.4 Política de Exclusão: Permite deletar imagens ao remover itens
CREATE POLICY "Permitir exclusão de capas no CineTrack"
    ON storage.objects
    FOR DELETE
    TO anon, authenticated
    USING (bucket_id = 'cinetrack-media');

-- ============================================================================
-- FIM DO SCRIPT: Tudo pronto!
-- O bucket 'cinetrack-media' e a tabela 'media_items' agora possuem políticas completas.
-- ============================================================================
