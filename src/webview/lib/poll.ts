import { writable, type Readable } from "svelte/store";

export interface PollState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  lastTickAt: number | null;
}

export interface PollOptions {
  intervalMs: number;
  isHidden?: () => boolean;
  onVisibilityChange?: (cb: () => void) => () => void;
  immediate?: boolean;
}

export interface Pollable<T> extends Readable<PollState<T>> {
  refresh: () => Promise<void>;
  dispose: () => void;
}

export function pollable<T>(
  _key: string,
  fetcher: () => Promise<T>,
  options: PollOptions,
): Pollable<T> {
  const store = writable<PollState<T>>({
    data: null,
    error: null,
    loading: false,
    lastTickAt: null,
  });

  let inFlight: Promise<void> | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;
  let disposeVisibility: (() => void) | null = null;

  const isHidden =
    options.isHidden ??
    (() => typeof document !== "undefined" && document.hidden);

  async function tick(): Promise<void> {
    if (isHidden()) {return;}
    if (inFlight) {return;} // single in-flight per key
    store.update((s) => ({ ...s, loading: true }));
    inFlight = (async () => {
      try {
        const data = await fetcher();
        store.set({
          data,
          error: null,
          loading: false,
          lastTickAt: Date.now(),
        });
      } catch (err) {
        store.update((s) => ({
          data: s.data,
          error: err instanceof Error ? err : new Error(String(err)),
          loading: false,
          lastTickAt: Date.now(),
        }));
      }
    })();
    try {
      await inFlight;
    } finally {
      inFlight = null;
    }
  }

  interval = setInterval(() => {
    void tick();
  }, options.intervalMs);

  if (options.onVisibilityChange) {
    disposeVisibility = options.onVisibilityChange(() => {
      if (!isHidden()) {void tick();}
    });
  } else if (typeof document !== "undefined") {
    const handler = (): void => {
      if (!isHidden()) {void tick();}
    };
    document.addEventListener("visibilitychange", handler);
    disposeVisibility = () =>
      document.removeEventListener("visibilitychange", handler);
  }

  if (options.immediate ?? true) {
    void tick();
  }

  return {
    subscribe: store.subscribe,
    refresh: tick,
    dispose: () => {
      if (interval !== null) {
        clearInterval(interval);
        interval = null;
      }
      if (disposeVisibility) {
        disposeVisibility();
        disposeVisibility = null;
      }
    },
  };
}
