import { Clock3, History as HistoryIcon, RefreshCw, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import SectionTitle from './SectionTitle';

export default function HistoryPanel({ history, onClear, onReanalyze }) {
  return (
    <section id="history" className="scroll-mt-8">
      <SectionTitle
        eyebrow="On this device"
        title="Recent analyses"
        description="Your latest predictions are saved in this browser so you can revisit or run them again."
        action={history.length > 0 ? (
          <button type="button" onClick={onClear} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-300">
            <Trash2 size={13} /> Clear history
          </button>
        ) : null}
      />

      <div className="overflow-hidden rounded-[23px] border border-slate-200/75 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
        {history.length === 0 ? (
          <div className="flex min-h-[170px] flex-col items-center justify-center px-5 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"><HistoryIcon size={19} /></span>
            <p className="mt-3 text-xs font-bold text-slate-700 dark:text-slate-200">No analyses saved yet</p>
            <p className="mt-1 text-[10px] text-slate-400">Your completed predictions will show up here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.map((item) => (
              <div key={item.id} className="group flex flex-col gap-3 px-4 py-4 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/25 sm:flex-row sm:items-center sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-200">{item.review}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-400">
                    <span className="inline-flex items-center gap-1"><Clock3 size={11} />{new Date(item.timestamp).toLocaleString()}</span>
                    <span>{item.model_name || item.model || 'Model'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-0 sm:pl-3">
                  <div className={`inline-flex min-w-[104px] items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold ${item.sentiment === 'Positive' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' : 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300'}`}>
                    {item.sentiment === 'Positive' ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
                    {item.sentiment} · {Number(item.confidence).toFixed(1)}%
                  </div>
                  <button type="button" onClick={() => onReanalyze(item)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[10px] font-bold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10" aria-label="Re-analyze review">
                    <RefreshCw size={12} /><span className="hidden sm:inline">Re-analyze</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
