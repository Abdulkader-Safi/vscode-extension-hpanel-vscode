import { writable, type Readable } from "svelte/store";

export type ToastTone = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
  createdAt: number;
}

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 4000;

interface ToastApi extends Readable<Toast[]> {
  push(tone: ToastTone, message: string): string;
  success(message: string): string;
  error(message: string): string;
  info(message: string): string;
  warning(message: string): string;
  dismiss(id: string): void;
  clear(): void;
}

function createToastStore(): ToastApi {
  const { subscribe, update, set } = writable<Toast[]>([]);
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  function dismiss(id: string): void {
    const t = timers.get(id);
    if (t) {
      clearTimeout(t);
      timers.delete(id);
    }
    update((toasts) => toasts.filter((t) => t.id !== id));
  }

  function push(tone: ToastTone, message: string): string {
    const id = crypto.randomUUID();
    const toast: Toast = { id, tone, message, createdAt: Date.now() };
    update((toasts) => {
      const next = [...toasts, toast];
      while (next.length > MAX_VISIBLE) {
        const dropped = next.shift();
        if (dropped) {
          const t = timers.get(dropped.id);
          if (t) {
            clearTimeout(t);
            timers.delete(dropped.id);
          }
        }
      }
      return next;
    });
    if (tone !== "error") {
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timers.set(id, timer);
    }
    return id;
  }

  function clear(): void {
    for (const t of timers.values()) {clearTimeout(t);}
    timers.clear();
    set([]);
  }

  return {
    subscribe,
    push,
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
    warning: (m) => push("warning", m),
    dismiss,
    clear,
  };
}

export const toasts = createToastStore();
