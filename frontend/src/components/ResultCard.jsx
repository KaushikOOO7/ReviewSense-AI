import { Activity, Database, Loader2, ThumbsDown, ThumbsUp, TriangleAlert, WandSparkles } from 'lucide-react';
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from 'recharts';

function ProbabilityRow({ label, value, color }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px]">
        <span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-bold tabular-nums text-slate-900 dark:text-white">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full transition-[width] duration-700 ${color}`} style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }} />
      </div>
    </div>
  );
}

export default function ResultCard({ result, loading, modelReady, error }) {
  const chartData = result
    ? [
        { name: 'Positive', value: result.positive_probability * 100, color: '#665cf0' },
        { name: 'Negative', value: result.negative_probability * 100, color: '#21b8a6' },
      ]
    : [];

  return (
    <section className="relative min-h-[438px] overflow-hidden rounded-[25px] border border-slate-200/75 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/80 sm:p-6">
      <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-violet-200/30 blur-3xl dark:bg-indigo-500/10" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Analysis result</p>
          <h3 className="mt-1 text-base font-bold tracking-[-0.025em] text-slate-900 dark:text-white">Sentiment readout</h3>
        </div>
        {result && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <Activity size={12} /> {result.model_name || result.model}
          </span>
        )}
      </div>

      {loading ? (
        <div className="relative flex min-h-[330px] flex-col items-center justify-center text-center">
          <div className="relative grid h-20 w-20 place-items-center rounded-full bg-indigo-50 dark:bg-indigo-500/10">
            <span className="absolute inset-0 animate-ping rounded-full border border-indigo-300/60 dark:border-indigo-400/25" />
            <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-300" size={31} />
          </div>
          <p className="mt-5 text-sm font-bold text-slate-800 dark:text-slate-100">Analyzing review...</p>
          <p className="mt-1.5 max-w-[240px] text-xs leading-relaxed text-slate-500 dark:text-slate-400">The selected recurrent model is scoring the review.</p>
        </div>
      ) : result ? (
        <div className="relative mt-5 animate-fade-up">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-950/45">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${result.sentiment === 'Positive' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' : 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300'}`}>
              {result.sentiment === 'Positive' ? <ThumbsUp size={20} /> : <ThumbsDown size={20} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Predicted sentiment</p>
              <p className="mt-0.5 text-lg font-bold tracking-[-0.035em] text-slate-900 dark:text-white">{result.sentiment}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold tracking-[-0.045em] text-slate-900 dark:text-white">{result.confidence.toFixed(1)}%</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">confidence</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-[1.05fr_0.95fr] items-center gap-2 sm:gap-4">
            <div className="relative h-[190px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="91%" paddingAngle={4} stroke="none" startAngle={90} endAngle={-270}>
                    {chartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Probability']} contentStyle={{ borderRadius: 12, border: '1px solid rgba(148,163,184,.25)', boxShadow: '0 12px 30px rgba(15,23,42,.12)', fontSize: 12 }} />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold tracking-[-0.05em] text-slate-900 dark:text-white">{result.confidence.toFixed(1)}%</span>
                <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-slate-400">confidence</span>
              </div>
            </div>
            <div className="space-y-4 pr-1">
              <ProbabilityRow label="Positive" value={result.positive_probability} color="bg-indigo-500" />
              <ProbabilityRow label="Negative" value={result.negative_probability} color="bg-teal-500" />
              <div className="flex items-center gap-1.5 text-[10px] leading-relaxed text-slate-400">
                <Database size={12} className="shrink-0" /> probabilities from model output
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex min-h-[335px] flex-col items-center justify-center px-5 text-center">
          <div className="relative grid h-[74px] w-[74px] place-items-center rounded-[23px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 text-indigo-500 dark:border-indigo-500/20 dark:from-indigo-500/10 dark:via-slate-900 dark:to-cyan-500/10 dark:text-indigo-300">
            <WandSparkles size={28} strokeWidth={1.6} />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-cyan-400 dark:border-slate-900" />
          </div>
          <h4 className="mt-5 text-sm font-bold text-slate-800 dark:text-slate-100">Your readout will appear here</h4>
          <p className="mt-2 max-w-[270px] text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Run an analysis to see the model's sentiment, confidence, and positive vs. negative probabilities.
          </p>
          {!modelReady && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              <TriangleAlert size={12} /> Model artifacts not loaded
            </div>
          )}
          {error && <p className="mt-3 max-w-xs text-[11px] leading-relaxed text-rose-600 dark:text-rose-300">{error}</p>}
        </div>
      )}
    </section>
  );
}
