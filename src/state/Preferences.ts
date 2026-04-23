import * as vscode from "vscode";

export type PollingIntervalMs = 30_000 | 60_000 | 120_000 | 300_000;
export type DeployPostAction = "none" | "restartDocker" | "openLog";

export interface PreferenceThresholds {
  cpu: number;
  ram: number;
  disk: number;
}

export interface DeployDefaults {
  preSnapshot: boolean;
  postAction: DeployPostAction;
  confirm: boolean;
  defaultDomain: string | null;
}

export interface PreferenceSchema {
  activeVpsId: number | null;
  pollingEnabled: boolean;
  pollingIntervalMs: PollingIntervalMs;
  statusBarEnabled: boolean;
  thresholds: PreferenceThresholds;
  notificationsOnThreshold: boolean;
  deploy: DeployDefaults;
}

const DEFAULTS: PreferenceSchema = {
  activeVpsId: null,
  pollingEnabled: true,
  pollingIntervalMs: 60_000,
  statusBarEnabled: true,
  thresholds: { cpu: 85, ram: 90, disk: 80 },
  notificationsOnThreshold: true,
  deploy: {
    preSnapshot: true,
    postAction: "none",
    confirm: true,
    defaultDomain: null,
  },
};

const KEY_PREFIX = "hostinger.";

export class Preferences {
  private readonly emitter = new vscode.EventEmitter<keyof PreferenceSchema>();
  readonly onDidChange: vscode.Event<keyof PreferenceSchema> =
    this.emitter.event;

  constructor(private readonly storage: vscode.Memento) {}

  get<K extends keyof PreferenceSchema>(key: K): PreferenceSchema[K] {
    const stored = this.storage.get<PreferenceSchema[K]>(KEY_PREFIX + key);
    if (stored === undefined) {return DEFAULTS[key];}
    // Shallow-merge object defaults so newly added subkeys don't read undefined.
    const fallback = DEFAULTS[key];
    if (
      typeof fallback === "object" &&
      fallback !== null &&
      !Array.isArray(fallback) &&
      typeof stored === "object" &&
      stored !== null
    ) {
      return { ...fallback, ...stored } as PreferenceSchema[K];
    }
    return stored;
  }

  async set<K extends keyof PreferenceSchema>(
    key: K,
    value: PreferenceSchema[K],
  ): Promise<void> {
    await this.storage.update(KEY_PREFIX + key, value);
    this.emitter.fire(key);
  }

  async reset(): Promise<void> {
    for (const key of Object.keys(DEFAULTS) as (keyof PreferenceSchema)[]) {
      await this.storage.update(KEY_PREFIX + key, undefined);
      this.emitter.fire(key);
    }
  }

  dispose(): void {
    this.emitter.dispose();
  }

  static defaults(): PreferenceSchema {
    return structuredClone(DEFAULTS);
  }

  /** Full schema with stored values merged over defaults — for one-shot reads. */
  snapshot(): PreferenceSchema {
    return {
      activeVpsId: this.get("activeVpsId"),
      pollingEnabled: this.get("pollingEnabled"),
      pollingIntervalMs: this.get("pollingIntervalMs"),
      statusBarEnabled: this.get("statusBarEnabled"),
      thresholds: this.get("thresholds"),
      notificationsOnThreshold: this.get("notificationsOnThreshold"),
      deploy: this.get("deploy"),
    };
  }
}
