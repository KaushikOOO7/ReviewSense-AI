import { FlaskConical, History as HistoryIcon, LayoutDashboard, MessageSquareText, ShieldCheck, Star } from 'lucide-react';
import { MODEL_OPTIONS } from '../data/models';
import Brand from './Brand';

export default function Sidebar({ activeNav, onNavigate, bestModel, modelReady }) {
  const links = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'analyzer', label: 'Review analyzer', icon: MessageSquareText },
    { id: 'model-arena', label: 'Model Arena', icon: FlaskConical },
    { id: 'history', label: 'Analysis history', icon: HistoryIcon },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-[252px] shrink-0 flex-col border-r border-slate-200/70 bg-white/80 px-5 py-6 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/75 lg:flex">
      <div className="px-1"><Brand /></div>
      <div className="mt-11 px-3 text-[10px] font-bold uppercase tracking-[0.19em] text-slate-400">Workspace</div>
      <nav className="mt-3 space-y-1" aria-label="Main navigation">
        {links.map(({ id, label, icon: Icon }) => {
          const selected = activeNav === id;
          return (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => onNavigate(id)}
              className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold transition-all duration-200 ${
                selected
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-950/[0.03] dark:bg-indigo-500/15 dark:text-indigo-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={17} strokeWidth={selected ? 2.2 : 1.9} />
              <span>{label}</span>
              {id === 'analyzer' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400 opacity-0 transition group-hover:opacity-100" />}
            </a>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50 via-white to-cyan-50/70 p-4 dark:border-indigo-500/15 dark:from-indigo-500/10 dark:via-slate-900 dark:to-cyan-500/5">
          <div className="flex items-center justify-between">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300"><ShieldCheck size={16} /></span>
            <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${modelReady ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'}`}>
              {modelReady ? 'Ready' : 'Setup'}
            </span>
          </div>
          <p className="mt-3 text-xs font-bold text-slate-800 dark:text-slate-100">Private by design</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Recent analyses stay in this browser. No account required.
          </p>
          {modelReady && bestModel && (
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
              <Star size={11} fill="currentColor" /> Current best: {MODEL_OPTIONS.find((item) => item.key === bestModel)?.name || bestModel}
            </div>
          )}
        </div>
        <div className="mt-5 flex items-center justify-between px-1 text-[10px] font-medium text-slate-400">
          <span>IMDB · RNN lab</span><span>v1.0</span>
        </div>
      </div>
    </aside>
  );
}
