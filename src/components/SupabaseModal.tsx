import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  UploadCloud,
  DownloadCloud,
  RefreshCw,
  ExternalLink,
  Code2,
  Trash2,
  RotateCcw,
  Sparkles,
  Download,
  FolderLock,
  Layers,
} from 'lucide-react';
import {
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  syncLocalItemsToSupabase,
  SUPABASE_SQL_SCRIPT,
  SUPABASE_STORAGE_POLICIES_SQL,
  SUPABASE_DATABASE_POLICIES_SQL,
  fetchMediaFromSupabase,
} from '../services/supabase.ts';
import { exportDataAsJson, resetToDefaultCatalog } from '../services/storage.ts';
import { MediaItem, SupabaseConfig } from '../types/index.ts';

interface SupabaseModalProps {
  onClose: () => void;
  currentItems: MediaItem[];
  onRefreshItems: (newItems: MediaItem[]) => void;
  onConfigChange: (config: SupabaseConfig) => void;
}

type SqlTab = 'all' | 'storage' | 'database';

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  onClose,
  currentItems,
  onRefreshItems,
  onConfigChange,
}) => {
  const currentConfig = getSavedSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tableExists: boolean;
  } | null>(null);
  const [activeSqlTab, setActiveSqlTab] = useState<SqlTab>('all');
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const getActiveSqlCode = () => {
    switch (activeSqlTab) {
      case 'storage':
        return SUPABASE_STORAGE_POLICIES_SQL;
      case 'database':
        return SUPABASE_DATABASE_POLICIES_SQL;
      case 'all':
      default:
        return SUPABASE_SQL_SCRIPT;
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection(url, anonKey);
    setTestResult(result);
    setIsTesting(false);

    if (result.success) {
      // Save config
      saveSupabaseConfig({ url, anonKey });
      onConfigChange({
        url,
        anonKey,
        isConnected: true,
      });
    }
  };

  const handleSaveAndConnect = () => {
    if (!url.trim() || !anonKey.trim()) {
      alert('Por favor, preencha a URL e a Anon Key do Supabase.');
      return;
    }
    saveSupabaseConfig({ url, anonKey });
    onConfigChange({
      url,
      anonKey,
      isConnected: true,
    });
    handleTestConnection();
  };

  const handleDisconnect = () => {
    if (confirm('Deseja desconectar o Supabase? O aplicativo passará a salvar apenas no armazenamento local.')) {
      clearSupabaseConfig();
      setUrl('');
      setAnonKey('');
      setTestResult(null);
      onConfigChange({
        url: '',
        anonKey: '',
        isConnected: false,
      });
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(getActiveSqlCode());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDownloadSqlFile = () => {
    const element = document.createElement('a');
    const file = new Blob([getActiveSqlCode()], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    const fileName =
      activeSqlTab === 'storage'
        ? 'supabase_storage_policies.sql'
        : activeSqlTab === 'database'
        ? 'supabase_database_policies.sql'
        : 'supabase_schema_completo.sql';
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    element.remove();
  };

  const handlePushToSupabase = async () => {
    setIsSyncing(true);
    setSyncStatus('Enviando itens locais para o Supabase...');
    const result = await syncLocalItemsToSupabase(currentItems);
    setIsSyncing(false);

    if (result.success) {
      setSyncStatus(`Sucesso! ${result.insertedCount} títulos enviados para o seu Supabase.`);
    } else {
      setSyncStatus(`Falha no envio: ${result.error || 'Erro desconhecido. Verifique se a tabela "media_items" foi criada no SQL Editor.'}`);
    }
  };

  const handlePullFromSupabase = async () => {
    setIsSyncing(true);
    setSyncStatus('Buscando dados mais recentes do Supabase...');
    const remote = await fetchMediaFromSupabase();
    setIsSyncing(false);

    if (remote && remote.length >= 0) {
      onRefreshItems(remote);
      setSyncStatus(`Carregados ${remote.length} títulos do Supabase com sucesso!`);
    } else {
      setSyncStatus('Não foi possível buscar dados do Supabase. Verifique a conexão e se a tabela existe.');
    }
  };

  const handleResetCatalog = () => {
    if (confirm('Tem certeza? Isso restaurará o catálogo inicial de demonstração (Frieren, Breaking Bad, Interestelar, etc.).')) {
      const resetItems = resetToDefaultCatalog();
      onRefreshItems(resetItems);
      alert('Catálogo inicial restaurado!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">
                Integração & Políticas do Supabase
              </h2>
              <p className="text-xs text-zinc-400">
                Banco de Dados, Políticas de Armazenamento e Sincronização
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Configuration Form */}
          <div className="space-y-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Database className="w-4 h-4" /> 1. Credenciais do Projeto Supabase
              </h3>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1 underline"
              >
                Abrir Supabase Dashboard <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Project URL (URL do Projeto)
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://seu-projeto.supabase.co"
                className="w-full px-3.5 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Anon Public Key (Chave Anônima Pública)
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Encontrada em: <strong>Project Settings → API → Project API Keys (anon public)</strong>.
              </p>
            </div>

            {/* Test and Save Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testando Conexão...' : 'Testar Conexão'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndConnect}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all"
              >
                Salvar e Conectar
              </button>

              {(url || anonKey) && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3 py-2 text-xs font-medium rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 transition-colors ml-auto flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Desconectar</span>
                </button>
              )}
            </div>

            {/* Live Connection Test Feedback */}
            {testResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-800/80 text-rose-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{testResult.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: SQL Script & Storage Policies instructions */}
          <div className="space-y-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Code2 className="w-4 h-4" /> 2. Scripts SQL & Políticas de Armazenamento
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadSqlFile}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                  title="Baixar arquivo .sql salvo"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar .sql</span>
                </button>

                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 transition-colors"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar SQL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* SQL Tab Selector */}
            <div className="flex items-center gap-1 border-b border-zinc-800 pb-2">
              <button
                onClick={() => setActiveSqlTab('all')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeSqlTab === 'all'
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Script Completo (Tudo)</span>
              </button>

              <button
                onClick={() => setActiveSqlTab('storage')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeSqlTab === 'storage'
                    ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60 font-semibold'
                    : 'text-zinc-400 hover:text-amber-300'
                }`}
              >
                <FolderLock className="w-3.5 h-3.5" />
                <span>Políticas de Armazenamento (Storage)</span>
              </button>

              <button
                onClick={() => setActiveSqlTab('database')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeSqlTab === 'database'
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 font-semibold'
                    : 'text-zinc-400 hover:text-emerald-300'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Tabela & RLS (Database)</span>
              </button>
            </div>

            {/* Instructions list */}
            <ol className="text-xs text-zinc-400 space-y-1 list-decimal pl-4">
              <li>
                O arquivo com as políticas também está salvo no projeto em <code>/supabase_schema.sql</code>.
              </li>
              <li>
                Acesse o painel do Supabase → aba <strong>SQL Editor</strong>.
              </li>
              <li>Cole o código SQL e clique em <strong>Run</strong>.</li>
              <li>
                O bucket de armazenamento <code>cinetrack-media</code> e todas as políticas RLS para upload, visualização e segurança serão ativadas!
              </li>
            </ol>

            {/* Collapsible/Scrollable SQL Preview */}
            <pre className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 font-mono overflow-x-auto max-h-48 scrollbar-thin">
              {getActiveSqlCode()}
            </pre>
          </div>

          {/* Step 3: Data Sync Actions */}
          <div className="space-y-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4" /> 3. Sincronização & Migração de Dados
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handlePushToSupabase}
                disabled={isSyncing}
                className="p-3 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-600/50 text-left transition-colors flex items-start gap-3 disabled:opacity-50"
              >
                <UploadCloud className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200">
                    Enviar dados locais para o Supabase
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Envia os {currentItems.length} títulos salvos localmente para o seu banco Supabase.
                  </p>
                </div>
              </button>

              <button
                onClick={handlePullFromSupabase}
                disabled={isSyncing}
                className="p-3 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-indigo-600/50 text-left transition-colors flex items-start gap-3 disabled:opacity-50"
              >
                <DownloadCloud className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200">
                    Baixar dados do Supabase
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Substitui o estado local pela versão mais recente na nuvem.
                  </p>
                </div>
              </button>
            </div>

            {syncStatus && (
              <p className="text-xs text-amber-300 font-medium bg-amber-950/40 border border-amber-900/50 p-2.5 rounded-lg">
                {syncStatus}
              </p>
            )}
          </div>

          {/* Backup & Catalog Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportDataAsJson(currentItems)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                Exportar Backup JSON
              </button>

              <button
                type="button"
                onClick={handleResetCatalog}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
                title="Restaura os títulos iniciais de exemplo"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar catálogo inicial
              </button>
            </div>
          </div>
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

