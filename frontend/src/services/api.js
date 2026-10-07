const API_ROOT = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      signal: options.signal || AbortSignal.timeout(30_000),
    });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new Error('The request timed out. Please try again in a moment.');
    }
    throw new Error('Unable to reach the ReviewSense API. Check that the backend is running.');
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The backend returned an invalid response. Please try again.');
  }

  if (!response.ok) {
    const detail = typeof payload?.detail === 'string' ? payload.detail : null;
    throw new Error(detail || `The backend returned an error (${response.status}).`);
  }
  return payload;
}

export function getHealth() {
  return request('/health');
}

export function getModels() {
  return request('/models');
}

export function analyzeReview(review, model) {
  return request('/predict', {
    method: 'POST',
    body: JSON.stringify({ review, model }),
  });
}
