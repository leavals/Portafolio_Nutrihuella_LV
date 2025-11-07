'use client';

type OpenPayload = { title?: string; subtitle?: string };

type Events =
  | { type: 'open'; payload: OpenPayload; controller: AbortController }
  | { type: 'close' }
  | { type: 'nextTip' };

const target = new EventTarget();
let currentController: AbortController | null = null;

function dispatch(detail: Events) {
  target.dispatchEvent(new CustomEvent('recipe-loading', { detail }));
}

export function onRecipeLoading(cb: (e: Events) => void) {
  const handler = (ev: Event) => cb((ev as CustomEvent).detail as Events);
  target.addEventListener('recipe-loading', handler as EventListener);
  return () => target.removeEventListener('recipe-loading', handler as EventListener);
}

export function openRecipeLoading(payload: OpenPayload = {}) {
  currentController?.abort('replaced-by-new-loading');
  currentController = new AbortController();
  dispatch({ type: 'open', payload, controller: currentController });
  return currentController;
}

export function closeRecipeLoading() {
  dispatch({ type: 'close' });
  currentController = null;
}

export function requestNextTip() {
  dispatch({ type: 'nextTip' });
}

export async function withRecipeLoading<T>(
  task: (signal: AbortSignal) => Promise<T>,
  payload?: OpenPayload
): Promise<T> {
  const controller = openRecipeLoading(payload);
  try {
    const result = await task(controller.signal);
    closeRecipeLoading();
    return result;
  } catch (err) {
    closeRecipeLoading();
    throw err;
  }
}
