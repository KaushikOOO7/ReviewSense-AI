import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import { analyzeReview, getHealth, getModels } from './services/api';

vi.mock('./services/api', () => ({
  analyzeReview: vi.fn(),
  getHealth: vi.fn(),
  getModels: vi.fn(),
}));

const health = {
  status: 'ok',
  backend: 'ReviewSense AI API',
  ml_ready: true,
  models_loaded: 3,
  best_model: 'gru',
  model_error: null,
  num_words: 10000,
  maxlen: 50,
};

const modelData = {
  models: [
    { key: 'simple_rnn', name: 'SimpleRNN', accuracy: 0.7853, validation_accuracy: 0.785, training_seconds: 13.6, available: true, status: 'ready', is_best: false },
    { key: 'lstm', name: 'LSTM', accuracy: 0.7875, validation_accuracy: 0.7966, training_seconds: 25.2, available: true, status: 'ready', is_best: false },
    { key: 'gru', name: 'GRU', accuracy: 0.7965, validation_accuracy: 0.7994, training_seconds: 20.7, available: true, status: 'ready', is_best: true },
  ],
  best_model: 'gru',
  selected_model: 'gru',
  dataset: 'Keras IMDB',
  training_config: {},
  ready: true,
};

describe('ReviewSense dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('renders a real API prediction in the result and history panels', async () => {
    getHealth.mockResolvedValue(health);
    getModels.mockResolvedValue(modelData);
    analyzeReview.mockResolvedValue({
      sentiment: 'Positive',
      confidence: 98.8,
      positive_probability: 0.9876,
      negative_probability: 0.0124,
      model: 'simple_rnn',
      model_name: 'SimpleRNN',
    });

    render(<App />);

    expect(await screen.findByText('Backend connected')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText(/Enter your review/i), {
      target: { value: 'I absolutely loved this movie.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Analyze review/i }));

    await waitFor(() => expect(analyzeReview).toHaveBeenCalledWith('I absolutely loved this movie.', 'simple_rnn'));
    expect((await screen.findAllByText('98.8%')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Positive').length).toBeGreaterThan(0);
    expect(screen.getByText('Positive · 98.8%')).toBeTruthy();
    expect(screen.getAllByText('I absolutely loved this movie.').length).toBeGreaterThan(0);
    expect(screen.getByText(/probabilities from model output/i)).toBeTruthy();
  });

  it('shows a user-facing error when the backend is unavailable', async () => {
    getHealth.mockRejectedValue(new Error('Unable to reach the ReviewSense API. Check that the backend is running.'));
    getModels.mockRejectedValue(new Error('Unable to reach the ReviewSense API. Check that the backend is running.'));
    analyzeReview.mockRejectedValue(new Error('Unable to reach the ReviewSense API. Check that the backend is running.'));

    render(<App />);

    expect(await screen.findByText('Backend offline')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText(/Enter your review/i), {
      target: { value: 'This review cannot reach a model.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Analyze review/i }));

    expect((await screen.findAllByText(/Unable to reach the ReviewSense API/i)).length).toBeGreaterThan(0);
  });

  it('requires non-empty review text', async () => {
    getHealth.mockResolvedValue(health);
    getModels.mockResolvedValue(modelData);

    render(<App />);
    await screen.findByText('Backend connected');
    fireEvent.click(screen.getByRole('button', { name: /Analyze review/i }));

    expect((await screen.findAllByText('Enter a review before analyzing.')).length).toBeGreaterThan(0);
    expect(analyzeReview).not.toHaveBeenCalled();
  });
});
