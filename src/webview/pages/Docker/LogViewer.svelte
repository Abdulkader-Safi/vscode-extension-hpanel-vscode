<script lang="ts">
    import Card from "../../lib/ui/Card.svelte";
    import Button from "../../lib/ui/Button.svelte";
    import Skeleton from "../../lib/ui/Skeleton.svelte";
    import { host } from "../../lib/host";
    import { toasts } from "../../lib/ui/toastStore";

    interface Props {
        vpsId: number;
        project: string;
        onclose: () => void;
    }

    let { vpsId, project, onclose }: Props = $props();

    let lines = $state<string[] | null>(null);
    let loading = $state(false);
    let autoScroll = $state(true);
    let preEl: HTMLPreElement | undefined = $state();

    const MAX_LINES = 300;

    async function fetchLogs(): Promise<void> {
        loading = true;
        try {
            const res = await host().request("getDockerLogs", {
                vpsId,
                name: project,
            });
            lines = res.lines.slice(-MAX_LINES);
        } catch (err) {
            toasts.error(
                err instanceof Error ? err.message : "Could not load logs",
            );
            lines = [];
        } finally {
            loading = false;
        }
    }

    $effect(() => {
        // Refetch when project changes.
        const _p = project;
        void _p;
        lines = null;
        void fetchLogs();
    });

    $effect(() => {
        if (autoScroll && preEl && lines && lines.length > 0) {
            preEl.scrollTop = preEl.scrollHeight;
        }
    });
</script>

<Card padded={false}>
    <div
        class="flex items-center justify-between px-3 py-1.5 border-b border-vscode-border bg-vscode-code-bg"
    >
        <div class="text-xs">
            <span class="text-vscode-description">Logs:</span>
            <span class="font-mono font-medium">{project}</span>
            {#if lines}
                <span class="ml-2 text-vscode-description text-[10px]"
                    >{lines.length} line{lines.length === 1 ? "" : "s"}</span
                >
            {/if}
        </div>
        <div class="flex items-center gap-3 text-xs">
            <label class="inline-flex items-center gap-1">
                <input type="checkbox" bind:checked={autoScroll} />
                Auto-scroll
            </label>
            <Button
                size="sm"
                variant="secondary"
                loading={loading}
                onclick={fetchLogs}>Refresh</Button
            >
            <Button size="sm" variant="ghost" onclick={onclose}>Close</Button>
        </div>
    </div>

    {#if lines === null}
        <div class="p-3"><Skeleton height="120px" /></div>
    {:else if lines.length === 0}
        <div class="p-3 text-xs text-vscode-description">
            No logs available.
        </div>
    {:else}
        <pre
            bind:this={preEl}
            class="font-mono text-[11px] bg-vscode-bg text-vscode-fg px-3 py-2 max-h-80 overflow-auto whitespace-pre">{lines.join("\n")}</pre>
    {/if}
</Card>
