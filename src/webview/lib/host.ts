import type {
  EventPayload,
  EventType,
  HostMessage,
  RequestPayload,
  RequestType,
  ResponsePayload,
  WebviewMessage,
} from "../../messaging/contract";

interface VsCodeApi {
  postMessage(message: unknown): void;
  getState?(): unknown;
  setState?(state: unknown): void;
}

declare const acquireVsCodeApi: () => VsCodeApi;

const REQUEST_TIMEOUT_MS = 30_000;

interface Pending {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

export interface Host {
  request<T extends RequestType>(
    type: T,
    payload?: RequestPayload<T>,
  ): Promise<ResponsePayload<T>>;
  on<E extends EventType>(
    eventType: E,
    listener: (payload: EventPayload<E>) => void,
  ): () => void;
}

export interface CreateHostOptions {
  api?: VsCodeApi;
  eventSource?: EventTarget;
  timeoutMs?: number;
}

export function createHost(opts: CreateHostOptions = {}): Host {
  const api = opts.api ?? acquireVsCodeApi();
  const target =
    opts.eventSource ??
    (typeof window !== "undefined" ? window : new EventTarget());
  const timeoutMs = opts.timeoutMs ?? REQUEST_TIMEOUT_MS;

  const pending = new Map<string, Pending>();
  const listeners = new Map<string, Set<(payload: unknown) => void>>();

  target.addEventListener("message", (ev) => {
    const data = (ev as MessageEvent).data as HostMessage | undefined;
    if (!data || typeof data !== "object") {return;}

    if (data.kind === "event") {
      const set = listeners.get(data.type);
      if (set) {for (const l of set) {l(data.payload);}}
      return;
    }

    if (data.kind === "response" || data.kind === "error") {
      const p = pending.get(data.id);
      if (!p) {return;}
      pending.delete(data.id);
      clearTimeout(p.timer);
      if (data.kind === "response") {
        p.resolve(data.payload);
      } else {
        p.reject(new Error(data.payload.message));
      }
    }
  });

  function request<T extends RequestType>(
    type: T,
    payload?: RequestPayload<T>,
  ): Promise<ResponsePayload<T>> {
    return new Promise<ResponsePayload<T>>((resolve, reject) => {
      const id = crypto.randomUUID();
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Request '${type}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      pending.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
        timer,
      });
      const message: WebviewMessage = {
        id,
        type,
        payload: payload as unknown,
      };
      api.postMessage(message);
    });
  }

  function on<E extends EventType>(
    eventType: E,
    listener: (payload: EventPayload<E>) => void,
  ): () => void {
    let set = listeners.get(eventType);
    if (!set) {
      set = new Set();
      listeners.set(eventType, set);
    }
    const wrapped = listener as (payload: unknown) => void;
    set.add(wrapped);
    return () => {
      set?.delete(wrapped);
    };
  }

  return { request, on };
}

let singleton: Host | null = null;

export function host(): Host {
  if (!singleton) {singleton = createHost();}
  return singleton;
}
