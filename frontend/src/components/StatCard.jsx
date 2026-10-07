export default function StatCard({ icon: Icon, label, value, detail, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  };
  return (
    <div className="group rounded-2xl border border-slate-200/75 bg-white p-4 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lift dark:border-slate-800 dark:bg-slate-900/80 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}><Icon size={17} /></span>
        {detail && <span className="mt-1 text-[10px] font-medium text-slate-400">{detail}</span>}
      </div>
      <p className="mt-4 truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 truncate text-xl font-bold tracking-[-0.04em] text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
