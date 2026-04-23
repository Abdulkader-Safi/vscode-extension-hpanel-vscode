import type { Vps } from "../api/types";

// Map of request type → { request payload, response payload }.
// Phases 2-8 extend this map with their own entries.
export interface RequestMap {
  hasToken: { request: undefined; response: boolean };
  validateToken: {
    request: { token: string };
    response: { ok: true; data: Vps[] } | { ok: false; error: string };
  };
  getActiveVpsId: { request: undefined; response: number | null };
  setActiveVpsId: { request: { id: number | null }; response: void };
  openExternal: { request: { url: string }; response: void };
}

export type RequestType = keyof RequestMap;
export type RequestPayload<T extends RequestType> = RequestMap[T]["request"];
export type ResponsePayload<T extends RequestType> = RequestMap[T]["response"];

// Map of host → webview event type → payload.
export interface EventMap {
  tokenChanged: { hasToken: boolean };
  preferenceChanged: { key: string };
  reload: undefined;
  navigate: { path: string };
}

export type EventType = keyof EventMap;
export type EventPayload<E extends EventType> = EventMap[E];

// Wire envelopes — what actually crosses postMessage.
export interface WebviewMessage {
  id: string;
  type: RequestType;
  payload: unknown;
}

export type HostMessage =
  | { id: string; kind: "response"; type: RequestType; payload: unknown }
  | {
      id: string;
      kind: "error";
      type: RequestType;
      payload: { message: string; code?: string };
    }
  | { kind: "event"; type: EventType; payload: unknown };
