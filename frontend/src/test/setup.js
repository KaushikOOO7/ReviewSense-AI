import { vi } from 'vitest';

// Recharts warns when jsdom reports zero-sized containers. This does not affect
// the dashboard assertions, so keep test output focused on real failures.
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const ignoreJsdomChartWarning = (args) =>
  args.some((arg) => typeof arg === 'string' && arg.includes('width(0) and height(0) of chart'));
console.error = (...args) => {
  if (ignoreJsdomChartWarning(args)) return;
  originalConsoleError(...args);
};
console.warn = (...args) => {
  if (ignoreJsdomChartWarning(args)) return;
  originalConsoleWarn(...args);
};

// jsdom does not implement browser APIs used by Recharts and dashboard navigation.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = globalThis.ResizeObserver || ResizeObserverMock;

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

// Older jsdom versions may not expose Web Crypto's randomUUID.
if (!globalThis.crypto?.randomUUID) {
  globalThis.crypto = {
    ...globalThis.crypto,
    randomUUID: () => `test-${Math.random().toString(36).slice(2, 10)}`,
  };
}
