<script lang="ts">
    import Card from "../../lib/ui/Card.svelte";
    import { preferences } from "../../lib/preferences";
    import { host } from "../../lib/host";
    import { toasts } from "../../lib/ui/toastStore";

    const intervals = [
        { ms: 30_000, label: "30s" },
        { ms: 60_000, label: "1m" },
        { ms: 120_000, label: "2m" },
        { ms: 300_000, label: "5m" },
    ] as const;

    const enabled = $derived($preferences?.pollingEnabled ?? true);
    const interval = $derived($preferences?.pollingIntervalMs ?? 60_000);
    const statusBarOn = $derived($preferences?.statusBarEnabled ?? true);

    async function setEnabled(e: Event): Promise<void> {
        const value = (e.target as HTMLInputElement).checked;
        try {
            await host().request("setPollingEnabled", { value });
        } catch (err) {
            toasts.error(
                err instanceof Error ? err.message : "Could not update polling",
            );
        }
    }

    async function setIntervalMs(value: number): Promise<void> {
        try {
            await host().request("setPollingIntervalMs", { value });
        } catch (err) {
            toasts.error(
                err instanceof Error
                    ? err.message
                    : "Could not update interval",
            );
        }
    }

    async function setStatusBar(e: Event): Promise<void> {
        const value = (e.target as HTMLInputElement).checked;
        try {
            await host().request("setStatusBarEnabled", { value });
        } catch (err) {
            toasts.error(
                err instanceof Error
                    ? err.message
                    : "Could not toggle status bar",
            );
        }
    }
</script>

<Card>
    <div class="space-y-3">
        <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enabled} onchange={setEnabled} />
            Enable metric polling
        </label>

        <div>
            <div class="text-xs text-vscode-description mb-1">
                Refresh interval
            </div>
            <div class="flex flex-wrap gap-3">
                {#each intervals as i (i.ms)}
                    <label class="inline-flex items-center gap-1.5 text-sm">
                        <input
                            type="radio"
                            name="pollingInterval"
                            checked={interval === i.ms}
                            disabled={!enabled}
                            onchange={() => setIntervalMs(i.ms)}
                        />
                        {i.label}
                    </label>
                {/each}
            </div>
        </div>

        <label class="flex items-center gap-2 text-sm">
            <input
                type="checkbox"
                checked={statusBarOn}
                onchange={setStatusBar}
            />
            Show CPU chip in the VS Code status bar
        </label>
    </div>
</Card>
