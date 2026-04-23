<script lang="ts">
    import { pollable } from "../../lib/poll";
    import { host } from "../../lib/host";
    import { preferences } from "../../lib/preferences";
    import Card from "../../lib/ui/Card.svelte";
    import Badge from "../../lib/ui/Badge.svelte";
    import Skeleton from "../../lib/ui/Skeleton.svelte";
    import EmptyState from "../../lib/ui/EmptyState.svelte";
    import type { VpsAction, VpsActionStatus } from "../../../api/types";

    interface Props {
        vpsId: number;
    }

    let { vpsId }: Props = $props();

    const intervalMs = $derived($preferences?.pollingIntervalMs ?? 60_000);

    let data = $state<VpsAction[] | null>(null);
    let loading = $state(true);
    let error = $state<Error | null>(null);

    $effect(() => {
        const id = vpsId;
        const ms = intervalMs;
        const p = pollable<VpsAction[]>(
            `vps:actions:${id}`,
            () => host().request("getVpsActions", { id, limit: 10 }),
            { intervalMs: ms },
        );
        const unsub = p.subscribe((s) => {
            data = s.data;
            loading = s.loading;
            error = s.error;
        });
        return () => {
            unsub();
            p.dispose();
        };
    });

    function badgeTone(
        status: VpsActionStatus,
    ): "neutral" | "success" | "warning" | "error" {
        if (status === "completed") {
            return "success";
        }
        if (status === "failed") {
            return "error";
        }
        if (status === "pending" || status === "running") {
            return "warning";
        }
        return "neutral";
    }

    function formatTimestamp(iso: string): string {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) {
            return iso;
        }
        return d.toLocaleString();
    }
</script>

<Card>
    <h3
        class="text-xs font-semibold uppercase tracking-wide text-vscode-description mb-2"
    >
        Recent Actions
    </h3>

    {#if error}
        <div
            class="border border-vscode-error/40 bg-vscode-error/10 text-vscode-error text-xs rounded p-2"
            role="alert"
        >
            Couldn't load actions: {error.message}
        </div>
    {:else if data === null && loading}
        <div class="space-y-2">
            <Skeleton height="20px" />
            <Skeleton height="20px" />
            <Skeleton height="20px" />
        </div>
    {:else if !data || data.length === 0}
        <EmptyState
            heading="No actions yet"
            description="Restart, stop, or recover the VPS to see entries here."
        />
    {:else}
        <ul class="divide-y divide-vscode-border text-sm">
            {#each data as action (action.id)}
                <li
                    class="flex items-center justify-between gap-3 py-1.5 hover:bg-vscode-list-hover px-2 -mx-2 rounded"
                >
                    <div class="min-w-0">
                        <div class="truncate">{action.type}</div>
                        <div
                            class="text-[10px] text-vscode-description font-mono"
                        >
                            {formatTimestamp(action.started_at)}
                        </div>
                    </div>
                    <Badge tone={badgeTone(action.status)}>
                        {action.status}
                    </Badge>
                </li>
            {/each}
        </ul>
    {/if}
</Card>
