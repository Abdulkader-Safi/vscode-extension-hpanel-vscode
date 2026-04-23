<script lang="ts">
    import Button from "../lib/ui/Button.svelte";
    import { host } from "../lib/host";

    type Phase = "idle" | "loading" | "error";

    let phase = $state<Phase>("idle");
    let token = $state("");
    let revealed = $state(false);
    let errorMessage = $state<string | null>(null);

    const DOC_URL = "https://developers.hostinger.com/#section/Authentication";

    async function submit(e: SubmitEvent): Promise<void> {
        e.preventDefault();
        const value = token.trim();
        if (!value || phase === "loading") {
            return;
        }
        phase = "loading";
        errorMessage = null;
        try {
            const result = await host().request("validateToken", {
                token: value,
            });
            if (result.ok) {
                // Host persisted token + emitted tokenChanged.
                // App.svelte's listener will replace("/") on the next tick.
                phase = "idle";
                token = "";
            } else {
                phase = "error";
                errorMessage = result.error;
            }
        } catch (err) {
            phase = "error";
            errorMessage =
                err instanceof Error
                    ? err.message
                    : "Could not reach Hostinger.";
        }
    }

    function toggleReveal(): void {
        revealed = !revealed;
    }

    async function openDocs(e: MouseEvent): Promise<void> {
        e.preventDefault();
        try {
            await host().request("openExternal", { url: DOC_URL });
        } catch {
            // Silently swallow — opening docs is best-effort.
        }
    }
</script>

<div class="flex items-center justify-center w-full h-full p-6">
    <div class="w-full max-w-md flex flex-col items-center text-center">
        <!-- Brand-neutral server-stack mark -->
        <svg
            class="text-vscode-fg mb-5"
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <rect x="2" y="3" width="20" height="6" rx="1" />
            <rect x="2" y="15" width="20" height="6" rx="1" />
            <circle cx="6" cy="6" r="0.5" fill="currentColor" />
            <circle cx="6" cy="18" r="0.5" fill="currentColor" />
            <line x1="10" y1="6" x2="18" y2="6" />
            <line x1="10" y1="18" x2="18" y2="18" />
        </svg>

        <h1 class="text-xl font-semibold mb-2">
            Connect your Hostinger account
        </h1>
        <p class="text-sm text-vscode-description max-w-sm mb-6">
            Paste your Hostinger API token. It's stored in VS Code's Secret
            Storage on this machine — never written to disk in plaintext, never
            sent anywhere except <span class="font-mono"
                >developers.hostinger.com</span
            >.
        </p>

        <form onsubmit={submit} class="w-full flex flex-col gap-3">
            {#if phase === "error" && errorMessage}
                <div
                    class="text-xs text-left px-3 py-2 rounded border-l-4 border-vscode-error bg-vscode-error/10 text-vscode-error"
                    role="alert"
                >
                    {errorMessage}
                </div>
            {/if}

            <div class="relative">
                <input
                    type={revealed ? "text" : "password"}
                    bind:value={token}
                    disabled={phase === "loading"}
                    required
                    autocomplete="off"
                    spellcheck="false"
                    aria-label="Hostinger API token"
                    placeholder="Paste your API token"
                    class="w-full px-3 py-2 pr-10 text-sm rounded bg-vscode-input-bg text-vscode-input-fg border border-vscode-input-border placeholder:text-vscode-input-placeholder focus:outline-none focus:ring-1 focus:ring-vscode-focus disabled:opacity-50"
                />
                <button
                    type="button"
                    onclick={toggleReveal}
                    aria-pressed={revealed}
                    aria-label={revealed ? "Hide token" : "Show token"}
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-vscode-description hover:text-vscode-fg p-1 rounded focus:outline-none focus:ring-1 focus:ring-vscode-focus"
                    tabindex="-1"
                >
                    {#if revealed}
                        <!-- Eye-off -->
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.75"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            aria-hidden="true"
                        >
                            <path
                                d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
                            />
                            <path
                                d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
                            />
                            <path d="M9.5 9.5a3 3 0 0 1 5 5" />
                            <line x1="2" y1="2" x2="22" y2="22" />
                        </svg>
                    {:else}
                        <!-- Eye -->
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.75"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    {/if}
                </button>
            </div>

            <Button
                type="submit"
                variant="primary"
                loading={phase === "loading"}
                disabled={!token.trim() || phase === "loading"}
            >
                Connect
            </Button>

            <a
                href={DOC_URL}
                onclick={openDocs}
                class="text-xs text-vscode-link hover:text-vscode-link-active mt-1"
            >
                How do I get a token?
            </a>
        </form>
    </div>
</div>
