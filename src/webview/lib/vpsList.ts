import { writable, type Readable } from "svelte/store";
import { host } from "./host";
import type { Vps } from "../../api/types";

const store = writable<Vps[] | null>(null);
let inFlight: Promise<void> | null = null;

export async function refresh(): Promise<void> {
  if (inFlight) {
    return inFlight;
  }
  inFlight = (async () => {
    try {
      const list = await host().request("listVps");
      store.set(list);
    } catch {
      // Swallow — consumers handle null gracefully.
    }
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export const vpsList: Readable<Vps[] | null> = {
  subscribe: store.subscribe,
};
