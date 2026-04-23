import { writable, type Readable } from "svelte/store";
import { host } from "./host";
import type { PreferenceSchema } from "../../messaging/contract";

const store = writable<PreferenceSchema | null>(null);

let initialised = false;

async function refresh(): Promise<void> {
  try {
    const snapshot = await host().request("getPreferences");
    store.set(snapshot);
  } catch {
    // Preferences fetch failure is non-fatal; consumers default-handle null.
  }
}

function init(): void {
  if (initialised) {
    return;
  }
  initialised = true;
  void refresh();
  host().on("preferenceChanged", () => {
    void refresh();
  });
}

init();

export const preferences: Readable<PreferenceSchema | null> = {
  subscribe: store.subscribe,
};
