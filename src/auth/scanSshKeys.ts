import * as crypto from "node:crypto";
import type { LocalSshKey } from "../messaging/contract";

/**
 * Minimal filesystem interface the SSH key scanner needs.
 * Implementations should never read non-`.pub` files.
 */
export interface SshKeyFs {
  /** Returns the basenames of entries in `dirPath`. May throw if missing. */
  listDir(dirPath: string): Promise<string[]>;
  /** Returns the file contents as UTF-8 text. */
  readTextFile(filePath: string): Promise<string>;
}

/**
 * Compute the OpenSSH-style SHA-256 fingerprint of a public key body.
 * The body is the base64 token between `<algo>` and the optional comment.
 */
export function fingerprintPublicKey(publicKey: string): string | null {
  const parts = publicKey.trim().split(/\s+/);
  if (parts.length < 2) {
    return null;
  }
  const body = parts[1]!;
  let buf: Buffer;
  try {
    buf = Buffer.from(body, "base64");
  } catch {
    return null;
  }
  if (buf.length === 0) {
    return null;
  }
  const hash = crypto.createHash("sha256").update(buf).digest("base64");
  return `SHA256:${hash.replace(/=+$/, "")}`;
}

/**
 * Scan `dirPath` for `*.pub` files and return parsed key metadata.
 * Private key files are ignored — they're never opened.
 * A missing directory returns `[]` rather than throwing.
 */
export async function scanSshKeys(
  fs: SshKeyFs,
  dirPath: string,
): Promise<LocalSshKey[]> {
  let entries: string[];
  try {
    entries = await fs.listDir(dirPath);
  } catch {
    return [];
  }

  const out: LocalSshKey[] = [];
  for (const name of entries) {
    if (!name.endsWith(".pub")) {
      continue;
    }
    const fullPath = `${dirPath}/${name}`;
    let content: string;
    try {
      content = await fs.readTextFile(fullPath);
    } catch {
      continue;
    }
    const trimmed = content.trim();
    if (!trimmed) {
      continue;
    }
    const fp = fingerprintPublicKey(trimmed);
    if (!fp) {
      continue;
    }
    out.push({
      name: name.replace(/\.pub$/, ""),
      path: fullPath,
      fingerprint: fp,
      keyPreview: trimmed.length > 32 ? `${trimmed.slice(0, 32)}…` : trimmed,
      key: trimmed,
    });
  }
  return out;
}
