import { Activity, BarChart3, Database, Gauge, Star } from 'lucide-react';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import SectionTitle from './SectionTitle';
import { DEFAULT_MODELS } from '../data/models';
import { formatPercent, formatTime } from '../lib/review';

function LegendDot({ color, label }) {
  return <span className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-500 dark:text-slate-400"><span className={`h-1.5 w-1.5 rounded-full ${color}`} />{label}</span>;
}

function ModelChart({ models }) {
  const chartData = useMemo(() => models
    .filter((model) => typeof model.accuracy === 'number' || typeof model.validation_accuracy === 'number')
    .map((model) => ({
      name: model.name,
      accuracy: model.accuracy,
      validation: model.validation_accuracy,
    })), [models]);

  if (chartData.length === 0) {
    return (
      <div className="mt-5 flex h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center dark:border-slate-700 dark:bg-slate-950/30">
        <BarChart3 size={24} className="text-slate-300 dark:text-slate-600" />
        <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Evaluation chart will appear after training</p>
        <p className="mt-1.5 max-w-[250px] text-[10px] leading-relaxed text-slate-400">The chart is populated from actual model evaluation results.</p>
      </div>
    );
  }

  return (
    <div className="mt-5 h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 0, left: -15, bottom: 0 }} barGap={5}>
          <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="rgba(148,163,184,.18)" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={8} />
          <YAxis domain={[0, 1]} axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value * 100)}%`} tick={{ fill: '#94a3b8', fontSize: 9 }} />
          <Tooltip formatter={(value) => [formatPercent(Number(value)), 'Accuracy']} contentStyle={{ borderRadius: 12, border: '1px solid rgba(148,163,184,.25)', boxShadow: '0 12px 30px rgba(15,23,42,.12)', fontSize: 11 }} />
          <Bar dataKey="accuracy" name="Test accuracy" fill="#665cf0" radius={[5, 5, 0, 0]} maxBarSize={26} />
          <Bar dataKey="validation" name="Validation accuracy" fill="#20b7a5" radius={[5, 5, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ModelArena({ modelData, selectedModel, onSelectModel }) {
  const models = modelData?.models || DEFAULT_MODELS;
  const bestModel = modelData?.best_model;
  const hasMetrics = models.some((model) => typeof model.accuracy === 'number' || typeof model.validation_accuracy === 'number');

  return (
    <section id="model-arena" className="scroll-mt-8">
      <SectionTitle
        eyebrow="Model Arena"
        title="Compare the recurrent models"
        description="Evaluation results come from the held-out IMDB test split and each model’s validation split. The selected model is highlighted."
        action={bestModel ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-2 text-[10px] font-bold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Star size={12} fill="currentColor" /> Best validation score
          </div>
        ) : null}
      />

      <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="overflow-hidden rounded-[23px] border border-slate-200/75 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Model leaderboard</p>
              <p className="mt-1 text-[10px] text-slate-400">Select a ready model to use it for your next prediction.</p>
            </div>
            <span className="hidden rounded-lg bg-slate-50 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-800 sm:inline-flex">3 architectures</span>
          </div>
          <div className="hidden grid-cols-[1.1fr_0.75fr_0.9fr_0.7fr] gap-3 bg-slate-50/70 px-6 py-2.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:bg-slate-950/40 sm:grid">
            <span>Model</span><span>Test accuracy</span><span>Validation</span><span>Time</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {models.map((model) => {
              const active = selectedModel === model.key;
              const isBest = bestModel === model.key;
              return (
                <button
                  key={model.key}
                  type="button"
                  onClick={() => model.available && onSelectModel(model.key)}
                  disabled={!model.available}
                  className={`grid w-full grid-cols-1 gap-2 px-5 py-4 text-left transition sm:grid-cols-[1.1fr_0.75fr_0.9fr_0.7fr] sm:items-center sm:gap-3 sm:px-6 ${
                    active ? 'bg-indigo-50/65 dark:bg-indigo-500/[0.07]' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/30'
                  } ${model.available ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>
                      {model.key === 'simple_rnn' ? <Activity size={16} /> : model.key === 'lstm' ? <Gauge size={16} /> : <BarChart3 size={16} />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{model.name}</span>
                        {isBest && <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">Best</span>}
                        {active && <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300">Selected</span>}
                      </span>
                      <span className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-[9px]">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${model.available ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <span className={`shrink-0 font-semibold ${model.available ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400'}`}>{model.available ? 'Ready' : 'Not loaded'}</span>
                        <span className="shrink-0 text-slate-300 dark:text-slate-700">·</span>
                        <span className="truncate text-slate-400">{model.description || 'Recurrent sequence classifier'}</span>
                      </span>
                    </span>
                  </span>
                  <span className="grid grid-cols-3 gap-2 pl-12 sm:contents">
                    <span className="sm:hidden"><span className="block text-[9px] text-slate-400">Test</span><span className="mt-0.5 block text-xs font-bold text-slate-700 dark:text-slate-200">{formatPercent(model.accuracy)}</span></span>
                    <span className="hidden text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200 sm:block">{formatPercent(model.accuracy)}</span>
                    <span className="sm:hidden"><span className="block text-[9px] text-slate-400">Validation</span><span className="mt-0.5 block text-xs font-bold text-slate-700 dark:text-slate-200">{formatPercent(model.validation_accuracy)}</span></span>
                    <span className="hidden text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200 sm:block">{formatPercent(model.validation_accuracy)}</span>
                    <span className="sm:hidden"><span className="block text-[9px] text-slate-400">Training time</span><span className="mt-0.5 block text-xs font-bold text-slate-700 dark:text-slate-200">{formatTime(model.training_seconds)}</span></span>
                    <span className="hidden text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-300 sm:block">{formatTime(model.training_seconds)}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {!hasMetrics && (
            <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-[10px] leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400 sm:px-6">
              No evaluation results yet. Train the three models to populate this arena — metrics are never simulated.
            </div>
          )}
        </div>

        <div className="rounded-[23px] border border-slate-200/75 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/80 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Performance comparison</p>
              <p className="mt-1 text-[10px] text-slate-400">Measured accuracy on validation and test data</p>
            </div>
            <div className="flex flex-col gap-1.5 pt-0.5">
              <LegendDot color="bg-indigo-500" label="Test" />
              <LegendDot color="bg-teal-500" label="Validation" />
            </div>
          </div>
          <ModelChart models={models} />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[9px] text-slate-400 dark:border-slate-800">
            <span className="inline-flex items-center gap-1.5"><Database size={11} /> IMDB hold-out evaluation</span>
            <span>Higher is better · no synthetic data</span>
          </div>
        </div>
      </div>
    </section>
  );
}
