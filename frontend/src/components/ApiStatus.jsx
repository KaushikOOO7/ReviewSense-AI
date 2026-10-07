import { RefreshCw } from 'lucide-react';

export default function ApiStatus({ connected, modelReady, checking, onRefresh }) {
  const label = checking ? 'Connecting' : connected ? 'Backend connected' : 'Backend offline';
  return (
    <button
      type="button"
      onClick={onRefresh}
      title={connected ? (modelReady ? 'Refresh backend status' : 'API is online; models need attention') : 'Retry backend connection'}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-indigo-500/60 dark:hover:text-white"
    >
      <span className="relative flex h-2 w-2">
        {connected && modelReady && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            checking ? 'bg-amber-400' : connected ? (modelReady ? 'bg-emerald-500' : 'bg-amber-400') : 'bg-rose-500'
          }`}
        />
      </span>
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{connected ? 'Online' : checking ? 'Checking' : 'Offline'}</span>
      <RefreshCw size={12} className={checking ? 'animate-spin' : ''} />
    </button>
  );
}
