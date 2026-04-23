import type { SecretStorage } from "vscode";
import {
  HostingerClient,
  type HostingerClientOptions,
} from "../api/HostingerClient";
import type { Vps } from "../api/types";

export type ValidateResult =
  | { ok: true; data: Vps[] }
  | { ok: false; error: string };

export class TokenStore {
  static readonly KEY = "hostinger.token";

  constructor(
    private readonly secrets: SecretStorage,
    private readonly clientOpts: HostingerClientOptions = {},
  ) {}

  async get(): Promise<string | undefined> {
    return this.secrets.get(TokenStore.KEY);
  }

  async set(token: string): Promise<void> {
    await this.secrets.store(TokenStore.KEY, token);
  }

  async clear(): Promise<void> {
    await this.secrets.delete(TokenStore.KEY);
  }

  async has(): Promise<boolean> {
    const token = await this.get();
    return Boolean(token);
  }

  async validate(token: string): Promise<ValidateResult> {
    const client = new HostingerClient(token, this.clientOpts);
    try {
      const data = await client.vps.list();
      return { ok: true, data };
    } catch (err) {
      // Surface only the message — never the token, never the headers.
      const message =
        err instanceof Error ? err.message : "Token validation failed";
      return { ok: false, error: message };
    }
  }
}
