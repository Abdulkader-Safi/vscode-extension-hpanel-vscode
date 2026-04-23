import * as assert from "assert";
import {
  scanSshKeys,
  fingerprintPublicKey,
  type SshKeyFs,
} from "../scanSshKeys";

// A real-looking ED25519 public key body (made up; not for any real account).
const SAMPLE_PUB =
  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEXAMPLEEXAMPLEEXAMPLEEXAMPLEEXAMPLEXX user@host";

function makeFakeFs(files: Record<string, string>): {
  fs: SshKeyFs;
  opened: string[];
} {
  const opened: string[] = [];
  const fs: SshKeyFs = {
    listDir: async (dirPath) => {
      const prefix = dirPath.endsWith("/") ? dirPath : `${dirPath}/`;
      return Object.keys(files)
        .filter((p) => p.startsWith(prefix))
        .map((p) => p.slice(prefix.length));
    },
    readTextFile: async (filePath) => {
      opened.push(filePath);
      const content = files[filePath];
      if (content === undefined) {
        throw new Error(`ENOENT: ${filePath}`);
      }
      return content;
    },
  };
  return { fs, opened };
}

suite("fingerprintPublicKey", () => {
  test("returns SHA256:… for a valid key", () => {
    const fp = fingerprintPublicKey(SAMPLE_PUB);
    assert.ok(fp);
    assert.match(fp!, /^SHA256:/);
  });

  test("returns null for malformed input", () => {
    assert.strictEqual(fingerprintPublicKey(""), null);
    assert.strictEqual(fingerprintPublicKey("just-one-word"), null);
  });
});

suite("scanSshKeys", () => {
  test("returns only .pub files; never opens private keys", async () => {
    const { fs, opened } = makeFakeFs({
      "/u/.ssh/id_ed25519.pub": SAMPLE_PUB,
      "/u/.ssh/id_ed25519": "PRIVATE-KEY-CONTENT-MUST-NOT-BE-OPENED",
      "/u/.ssh/id_rsa.pub": SAMPLE_PUB,
      "/u/.ssh/id_rsa": "PRIVATE-KEY-CONTENT-MUST-NOT-BE-OPENED",
      "/u/.ssh/known_hosts": "host1 ssh-rsa ...",
      "/u/.ssh/config": "Host *\n  ForwardAgent yes",
    });

    const keys = await scanSshKeys(fs, "/u/.ssh");

    assert.strictEqual(keys.length, 2);
    const names = keys.map((k) => k.name).sort();
    assert.deepStrictEqual(names, ["id_ed25519", "id_rsa"]);

    // Critical: the private-key files (and config/known_hosts) must NEVER
    // appear in the opened list.
    for (const path of opened) {
      assert.ok(
        path.endsWith(".pub"),
        `non-.pub file was opened: ${path}`
      );
    }
    assert.ok(!opened.includes("/u/.ssh/id_ed25519"));
    assert.ok(!opened.includes("/u/.ssh/id_rsa"));
    assert.ok(!opened.includes("/u/.ssh/config"));
    assert.ok(!opened.includes("/u/.ssh/known_hosts"));
  });

  test("missing directory returns []", async () => {
    const fs: SshKeyFs = {
      listDir: async () => {
        throw new Error("ENOENT");
      },
      readTextFile: async () => {
        throw new Error("should not be called");
      },
    };
    const keys = await scanSshKeys(fs, "/nope");
    assert.deepStrictEqual(keys, []);
  });

  test("empty directory returns []", async () => {
    const { fs } = makeFakeFs({});
    const keys = await scanSshKeys(fs, "/u/.ssh");
    assert.deepStrictEqual(keys, []);
  });

  test("malformed .pub file is skipped", async () => {
    const { fs } = makeFakeFs({
      "/u/.ssh/good.pub": SAMPLE_PUB,
      "/u/.ssh/bad.pub": "not-a-real-key",
    });
    const keys = await scanSshKeys(fs, "/u/.ssh");
    assert.strictEqual(keys.length, 1);
    assert.strictEqual(keys[0]?.name, "good");
  });

  test("each returned entry has fingerprint + key + path", async () => {
    const { fs } = makeFakeFs({
      "/u/.ssh/id_ed25519.pub": SAMPLE_PUB,
    });
    const keys = await scanSshKeys(fs, "/u/.ssh");
    const k = keys[0]!;
    assert.strictEqual(k.name, "id_ed25519");
    assert.strictEqual(k.path, "/u/.ssh/id_ed25519.pub");
    assert.match(k.fingerprint, /^SHA256:/);
    assert.strictEqual(k.key, SAMPLE_PUB);
    assert.ok(k.keyPreview.length > 0);
  });
});
