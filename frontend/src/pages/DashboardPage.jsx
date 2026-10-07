import { useMemo, useState } from 'react';
import {
  BookOpenCheck,
  CircleHelp,
  FlaskConical,
  History as HistoryIcon,
  LayoutDashboard,
  MessageSquareText,
  Moon,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import ApiStatus from '../components/ApiStatus';
import Brand from '../components/Brand';
import HeroSection from '../components/HeroSection';
import HistoryPanel from '../components/HistoryPanel';
import ModelArena from '../components/ModelArena';
import ReviewAnalyzer from '../components/ReviewAnalyzer';
import Sidebar from '../components/Sidebar';
import StatisticsSection from '../components/StatisticsSection';
import { DEFAULT_MODELS, MAX_REVIEW_LENGTH } from '../data/models';
import { useApiStatus } from '../hooks/useApiStatus';
import { useReviewHistory } from '../hooks/useReviewHistory';
import { useTheme } from '../hooks/useTheme';
import { getHistoryId, wordCount } from '../lib/review';
import { analyzeReview } from '../services/api';

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [review, setReview] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const {
    health,
    modelData,
    selectedModel,
    setSelectedModel,
    isChecking,
    refreshStatus,
  } = useApiStatus();
  const { history, addEntry, clearHistory } = useReviewHistory();

  const currentResult = result && result.review === review.trim() ? result : null;
  const connected = Boolean(health);
  const modelReady = Boolean(health?.ml_ready);
  const modelRows = modelData?.models || DEFAULT_MODELS;
  const wordTotal = useMemo(() => wordCount(review), [review]);

  const handleReviewChange = (value) => {
    setReview(value);
    setResult(null);
    setError('');
  };

  const runPrediction = async (inputReview = review, requestedModel = selectedModel) => {
    const cleaned = inputReview.trim();
    if (!cleaned) {
      setError('Enter a review before analyzing.');
      setResult(null);
      return;
    }
    if (cleaned.length > MAX_REVIEW_LENGTH) {
      setError(`Reviews must be ${MAX_REVIEW_LENGTH.toLocaleString()} characters or fewer.`);
      return;
    }

    setReview(cleaned);
    setResult(null);
    setError('');
    setIsAnalyzing(true);
    try {
      const prediction = await analyzeReview(cleaned, requestedModel);
      const entry = {
        ...prediction,
        review: cleaned,
        id: getHistoryId(),
        timestamp: new Date().toISOString(),
      };
      setResult(entry);
      addEntry(entry);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The review could not be analyzed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExample = (example) => {
    setReview(example.review);
    setResult(null);
    setError('');
    setActiveNav('analyzer');
    document.getElementById('analyzer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleReanalyze = (item) => {
    const model = item.model || modelData?.selected_model || 'simple_rnn';
    setReview(item.review);
    setResult(null);
    setError('');
    setSelectedModel(model);
    document.getElementById('analyzer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    runPrediction(item.review, model);
  };

  const nav = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'analyzer', label: 'Analyze', icon: MessageSquareText },
    { id: 'model-arena', label: 'Arena', icon: FlaskConical },
    { id: 'history', label: 'History', icon: HistoryIcon },
  ];

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} min-h-screen bg-[#f7f8fc] text-slate-800 transition-colors duration-300 dark:bg-[#080d18] dark:text-slate-100`}>
      <div className="flex min-h-screen">
        <Sidebar
          activeNav={activeNav}
          onNavigate={setActiveNav}
          bestModel={modelData?.best_model}
          modelReady={modelReady}
        />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#f7f8fc]/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#080d18]/80">
            <div className="mx-auto flex h-[72px] max-w-[1450px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-9">
              <div className="flex min-w-0 items-center gap-3 lg:hidden"><Brand compact /><span className="text-sm font-bold tracking-[-0.03em] text-slate-900 dark:text-white">ReviewSense <span className="text-indigo-600 dark:text-indigo-300">AI</span></span></div>
              <div className="hidden min-w-0 items-center gap-2 text-xs text-slate-400 lg:flex">
                <span>Workspace</span><span className="text-slate-300 dark:text-slate-700">/</span><span className="font-semibold text-slate-700 dark:text-slate-200">Review intelligence</span>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
                <ApiStatus connected={connected} modelReady={modelReady} checking={isChecking} onRefresh={refreshStatus} />
                <a href="/api/docs" target="_blank" rel="noreferrer" className="hidden h-9 w-9 place-items-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:text-indigo-300 sm:grid" title="Open API documentation" aria-label="Open API documentation"><CircleHelp size={16} /></a>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:text-indigo-300"
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              </div>
            </div>
            <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-slate-200/50 px-3 py-2 dark:border-slate-800/70 lg:hidden" aria-label="Mobile navigation">
              {nav.map(({ id, label, icon: Icon }) => (
                <a key={id} href={`#${id}`} onClick={() => setActiveNav(id)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold transition ${activeNav === id ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' : 'text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-900'}`}>
                  <Icon size={13} />{label}
                </a>
              ))}
            </nav>
          </header>

          <main className="mx-auto max-w-[1450px] space-y-10 px-4 pb-10 pt-7 sm:space-y-12 sm:px-6 sm:pt-9 lg:px-9 lg:pt-10">
            <HeroSection onNavigate={setActiveNav} />

            <ReviewAnalyzer
              review={review}
              result={currentResult}
              error={error}
              isAnalyzing={isAnalyzing}
              modelReady={modelReady}
              connected={connected}
              modelRows={modelRows}
              selectedModel={selectedModel}
              wordTotal={wordTotal}
              onReviewChange={handleReviewChange}
              onAnalyze={() => runPrediction()}
              onSelectModel={setSelectedModel}
              onExample={handleExample}
            />

            <StatisticsSection
              review={review}
              wordTotal={wordTotal}
              result={currentResult}
              selectedModel={selectedModel}
              modelData={modelData}
            />

            <ModelArena modelData={modelData} selectedModel={selectedModel} onSelectModel={setSelectedModel} />

            <HistoryPanel history={history} onClear={clearHistory} onReanalyze={handleReanalyze} />

            <footer className="flex flex-col gap-3 border-t border-slate-200/70 pt-5 text-[10px] text-slate-400 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <p>ReviewSense AI <span className="mx-1.5 text-slate-300 dark:text-slate-700">·</span> A transparent recurrent NLP learning workspace.</p>
              <div className="flex items-center gap-4">
                <a href="/api/docs" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 transition hover:text-indigo-600 dark:hover:text-indigo-300"><BookOpenCheck size={12} /> API docs</a>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck size={12} /> History stays on this device</span>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
