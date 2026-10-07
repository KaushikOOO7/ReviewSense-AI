import { Sparkles } from 'lucide-react';

export default function Brand({ compact = false }) {
  return (
    <a href="#dashboard" className="group inline-flex items-center gap-3" aria-label="ReviewSense AI home">
      <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-[14px] bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-400 text-white shadow-lg shadow-indigo-500/20 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
        <Sparkles size={19} strokeWidth={2.2} />
        <span className="absolute -bottom-3 -right-2 h-7 w-7 rounded-full bg-white/20 blur-md" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[15px] font-bold tracking-[-0.04em] text-slate-900 dark:text-white">
            ReviewSense <span className="text-indigo-600 dark:text-indigo-300">AI</span>
          </span>
          <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Review intelligence
          </span>
        </span>
      )}
    </a>
  );
}
