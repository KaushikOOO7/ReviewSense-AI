import { BookOpenCheck, ChevronDown, FileText, Loader2, Send, TriangleAlert } from 'lucide-react';
import { EXAMPLES } from '../data/examples';
import { MAX_REVIEW_LENGTH } from '../data/models';
import ResultCard from './ResultCard';
import SectionTitle from './SectionTitle';

export default function ReviewAnalyzer({
  review,
  result,
  error,
  isAnalyzing,
  modelReady,
  connected,
  modelRows,
  selectedModel,
  wordTotal,
  onReviewChange,
  onAnalyze,
  onSelectModel,
  onExample,
}) {
  return (
    <section id="analyzer" className="scroll-mt-28">
      <SectionTitle
        eyebrow="Start with a review"
        title="Review analyzer"
        description="Paste a movie or product review. The model returns a binary sentiment and its probability scores."
        action={<span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400"><BookOpenCheck size={13} /> Recurrent model inference</span>}
      />
      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-[25px] border border-slate-200/75 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/80 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="review-input" className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"><FileText size={15} /></span>Review text</label>
            <span className="text-[9px] font-semibold text-slate-400">{review.length.toLocaleString()} / {MAX_REVIEW_LENGTH.toLocaleString()}</span>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/65 transition focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/[0.06] dark:border-slate-700 dark:bg-slate-950/40 dark:focus-within:border-indigo-500/50 dark:focus-within:bg-slate-950/65">
            <textarea
              id="review-input"
              value={review}
              onChange={(event) => onReviewChange(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') onAnalyze();
              }}
              maxLength={MAX_REVIEW_LENGTH}
              placeholder="Enter your review... What did you think about the story, acting, quality, or experience?"
              className="min-h-[210px] w-full resize-y bg-transparent px-4 py-4 text-[13px] leading-[1.8] text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-600 sm:min-h-[230px] sm:px-5"
              aria-describedby={error ? 'review-error' : 'review-help'}
            />
            <div className="flex items-center justify-between border-t border-slate-200/70 px-4 py-2.5 dark:border-slate-800 sm:px-5">
              <span id="review-help" className="text-[9px] text-slate-400">Tip: press <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">⌘ / Ctrl</kbd> + Enter to analyze</span>
              <span className="text-[9px] tabular-nums text-slate-400">{wordTotal} {wordTotal === 1 ? 'word' : 'words'}</span>
            </div>
          </div>
          {error && (
            <div id="review-error" role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-[11px] leading-relaxed text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              <TriangleAlert size={14} className="mt-0.5 shrink-0" /> <span>{error}</span>
            </div>
          )}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="min-w-0 flex-1">
              <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.13em] text-slate-400">Run with</span>
              <span className="relative block max-w-[220px]">
                <select
                  value={selectedModel}
                  onChange={(event) => onSelectModel(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-8 text-xs font-semibold text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/[0.06] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  aria-label="Select sentiment model"
                >
                  {modelRows.map((model) => (
                    <option key={model.key} value={model.key} disabled={connected && !model.available}>{model.name}{model.is_best ? ' · Best' : ''}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </span>
            </label>
            <button
              type="button"
              onClick={() => onAnalyze()}
              disabled={isAnalyzing}
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-600/30 disabled:cursor-wait disabled:opacity-80 disabled:hover:translate-y-0 sm:min-w-[178px]"
            >
              {isAnalyzing ? <><Loader2 size={15} className="animate-spin" /> Analyzing review...</> : <><Send size={14} /> Analyze review</>}
            </button>
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Try an example</span>
              <span className="text-[9px] text-slate-400">Click to fill the editor</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button key={example.label} type="button" onClick={() => onExample(example)} className={`rounded-full border px-2.5 py-1.5 text-[9px] font-semibold transition hover:-translate-y-0.5 ${example.tone === 'positive' ? 'border-indigo-100 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15' : example.tone === 'negative' ? 'border-teal-100 bg-teal-50/80 text-teal-700 hover:bg-teal-100 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300 dark:hover:bg-teal-500/15' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                  {example.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <ResultCard result={result} loading={isAnalyzing} modelReady={modelReady} error={error} />
      </div>
    </section>
  );
}
