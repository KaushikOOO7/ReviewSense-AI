import { Activity, FileText, Gauge, MessageSquareText, ThumbsDown, ThumbsUp } from 'lucide-react';
import { MODEL_OPTIONS } from '../data/models';
import SectionTitle from './SectionTitle';
import StatCard from './StatCard';

export default function StatisticsSection({ review, wordTotal, result, selectedModel, modelData }) {
  const selectedName = MODEL_OPTIONS.find((item) => item.key === selectedModel)?.name || '—';
  return (
    <section aria-label="Review statistics">
      <SectionTitle eyebrow="Review statistics" title="A quick snapshot" description="Text counts update as you type; sentiment and confidence appear after a successful prediction." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={FileText} label="Characters" value={review.length.toLocaleString()} detail="including spaces" tone="indigo" />
        <StatCard icon={MessageSquareText} label="Words" value={wordTotal.toLocaleString()} detail="whitespace counted" tone="cyan" />
        <StatCard icon={result?.sentiment === 'Negative' ? ThumbsDown : ThumbsUp} label="Estimated sentiment" value={result?.sentiment || '—'} detail={result ? 'model prediction' : 'awaiting analysis'} tone={result?.sentiment === 'Negative' ? 'green' : 'violet'} />
        <StatCard icon={Gauge} label="Confidence" value={result ? `${result.confidence.toFixed(1)}%` : '—'} detail="top class probability" tone="green" />
        <StatCard icon={Activity} label="Selected model" value={selectedName} detail={modelData?.best_model === selectedModel ? 'best validation score' : 'active selection'} tone="slate" />
      </div>
    </section>
  );
}
