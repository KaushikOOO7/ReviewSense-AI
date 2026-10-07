export const MODEL_OPTIONS = [
  { key: 'simple_rnn', name: 'SimpleRNN', description: 'A compact recurrent baseline' },
  { key: 'lstm', name: 'LSTM', description: 'Long short-term memory' },
  { key: 'gru', name: 'GRU', description: 'Gated recurrent unit' },
];

export const DEFAULT_MODELS = MODEL_OPTIONS.map((model) => ({
  ...model,
  accuracy: null,
  validation_accuracy: null,
  training_seconds: null,
  available: false,
  status: 'not_trained',
  is_best: false,
}));

export const MAX_REVIEW_LENGTH = 20_000;
