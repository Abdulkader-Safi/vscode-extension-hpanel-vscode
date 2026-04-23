import type { PublicKey, Vps, VpsAction, VpsMetrics } from "../api/types";
import type {
  PreferenceSchema,
  DeployDefaults,
  PreferenceThresholds,
} from "../state/Preferences";

// Re-export so webview-side modules can consume PreferenceSchema without
// importing from src/state/* (which pulls vscode at runtime).
export type { PreferenceSchema };

export type VpsActionKind = "restart" | "stop" | "recovery";

export interface LocalSshKey {
  name: string;
  path: string;
  fingerprint: string;
  keyPreview: string;
  key: string;
}

export type TestConnectionResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

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

  // Phase 3 — Overview tab.
  getActiveVps: { request: undefined; response: Vps | null };
  getVpsMetrics: { request: { id: number }; response: VpsMetrics };
  getVpsActions: {
    request: { id: number; limit?: number };
    response: VpsAction[];
  };
  vpsAction: {
    request: { id: number; action: VpsActionKind };
    response: VpsAction;
  };
  getAttachedKeys: { request: { id: number }; response: PublicKey[] };
  openTerminal: {
    request: { command: string; name?: string };
    response: void;
  };
  getPreferences: { request: undefined; response: PreferenceSchema };

  // Phase 4 — Settings tab.
  listVps: { request: undefined; response: Vps[] };
  testConnection: { request: undefined; response: TestConnectionResult };
  getTokenMasked: { request: undefined; response: string | null };
  disconnect: { request: undefined; response: void };
  resetPreferences: { request: undefined; response: void };
  setPollingEnabled: { request: { value: boolean }; response: void };
  setPollingIntervalMs: { request: { value: number }; response: void };
  setStatusBarEnabled: { request: { value: boolean }; response: void };
  setThresholds: { request: { value: PreferenceThresholds }; response: void };
  setNotificationsOnThreshold: {
    request: { value: boolean };
    response: void;
  };
  setDeployDefaults: { request: { value: DeployDefaults }; response: void };
  listAccountKeys: { request: undefined; response: PublicKey[] };
  createAccountKey: {
    request: { name: string; key: string };
    response: PublicKey;
  };
  deleteAccountKey: { request: { id: number }; response: void };
  scanSshKeys: { request: undefined; response: LocalSshKey[] };
  setSnoozeStatusBar: { request: { value: boolean }; response: void };
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
