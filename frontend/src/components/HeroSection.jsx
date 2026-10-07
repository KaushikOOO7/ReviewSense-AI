import { Activity, ArrowRight, BarChart3, Check } from 'lucide-react';

export default function HeroSection({ onNavigate }) {
  return (
    <section id="dashboard" className="scroll-mt-28 animate-fade-up">
      <div className="relative overflow-hidden rounded-[28px] border border-indigo-100/70 bg-gradient-to-br from-white via-[#f7f6ff] to-[#effbff] p-5 shadow-soft dark:border-indigo-500/15 dark:from-slate-900 dark:via-[#11162a] dark:to-[#0c1c26] sm:p-8 lg:p-9">
        <div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full bg-violet-300/20 blur-[75px] dark:bg-indigo-500/10" />
        <div className="pointer-events-none absolute bottom-[-120px] right-[26%] h-64 w-64 rounded-full bg-cyan-200/25 blur-[85px] dark:bg-cyan-500/10" />
        <div className="relative grid gap-7 lg:grid-cols-[1fr_310px] lg:items-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-indigo-700 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/60 dark:text-indigo-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Recurrent NLP workspace
            </div>
            <h1 className="mt-4 max-w-[700px] text-[32px] font-bold leading-[1.08] tracking-[-0.055em] text-slate-950 dark:text-white sm:text-[42px] lg:text-[48px]">
              Understand the feeling <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-cyan-300">behind every review.</span>
            </h1>
            <p className="mt-4 max-w-[610px] text-[13px] leading-[1.8] text-slate-500 dark:text-slate-400 sm:text-sm">
              Explore review sentiment with real SimpleRNN, LSTM, and GRU models trained on IMDB. See the score, the probabilities, and how the models compare.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="#analyzer" onClick={() => onNavigate('analyzer')} className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
                Analyze a review <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <a href="#model-arena" onClick={() => onNavigate('model-arena')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/75 px-4 py-3 text-xs font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-white hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:text-white">
                <BarChart3 size={14} /> Explore Model Arena
              </a>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute inset-3 rounded-[30px] bg-gradient-to-br from-indigo-400/20 to-cyan-300/20 blur-2xl" />
            <div className="relative rounded-[23px] border border-white/80 bg-white/70 p-5 shadow-lg shadow-indigo-950/[0.04] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/40">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400"><Activity size={13} className="text-indigo-500" /> Pipeline at a glance</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,.12)]" />
              </div>
              <div className="mt-5 space-y-3">
                {[
                  { number: '01', title: 'Review text', detail: 'Tokenized and encoded', width: 'w-full' },
                  { number: '02', title: '50-token sequence', detail: 'Padded to a fixed length', width: 'w-[84%]' },
                  { number: '03', title: 'RNN inference', detail: 'Sigmoid probability output', width: 'w-[68%]' },
                ].map((item) => (
                  <div key={item.number} className={`relative overflow-hidden rounded-xl border border-slate-100 bg-white/85 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/70 ${item.width}`}>
                    <span className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-indigo-500 to-cyan-400" />
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-50 text-[9px] font-black text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">{item.number}</span>
                      <span><span className="block text-[10px] font-bold text-slate-700 dark:text-slate-200">{item.title}</span><span className="mt-0.5 block text-[9px] text-slate-400">{item.detail}</span></span>
                      <Check size={13} className="ml-auto text-emerald-500" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="text-[9px] font-semibold text-slate-400">Vocabulary <b className="text-slate-700 dark:text-slate-200">10,000 words</b></span>
                <span className="text-[9px] font-semibold text-slate-400">Embedding <b className="text-slate-700 dark:text-slate-200">2 dimensions</b></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
