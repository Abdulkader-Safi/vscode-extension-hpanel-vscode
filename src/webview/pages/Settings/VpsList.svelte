<script lang="ts">
    import { onMount } from "svelte";
    import Card from "../../lib/ui/Card.svelte";
    import Button from "../../lib/ui/Button.svelte";
    import Badge from "../../lib/ui/Badge.svelte";
    import StatusDot from "../../lib/ui/StatusDot.svelte";
    import Skeleton from "../../lib/ui/Skeleton.svelte";
    import EmptyState from "../../lib/ui/EmptyState.svelte";
    import { vpsList, refresh } from "../../lib/vpsList";
    import { preferences } from "../../lib/preferences";
    import { host } from "../../lib/host";
    import { toasts } from "../../lib/ui/toastStore";
    import { primaryIp } from "../../lib/vpsFields";
    import type { Vps, VpsState } from "../../../api/types";

    const list = $derived($vpsList);
    const activeId = $derived($preferences?.activeVpsId ?? null);

    let refreshing = $state(false);

    onMount(() => {
        void refresh();
    });

    async function manualRefresh(): Promise<void> {
        refreshing = true;
        try {
            await refresh();
        } finally {
            refreshing = false;
        }
    }

    async function setDefault(v: Vps): Promise<void> {
        try {
            await host().request("setActiveVpsId", { id: v.id });
            toasts.success(`${v.hostname} is now the default VPS`);
        } catch (err) {
            toasts.error(
                err instanceof Error ? err.message : "Could not update default",
            );
        }
    }

    function mapState(
        s: VpsState,
    ): "running" | "stopped" | "error" | "unknown" {
        if (s === "running") {
            return "running";
        }
        if (s === "stopped") {
            return "stopped";
        }
        return "unknown";
    }
</script>

<Card>
    <div class="flex items-center justify-between mb-2">
        <p class="text-xs text-vscode-description">
            Every tab reflects the default VPS. Changing the default fires an
            immediate refresh across Overview and related views.
        </p>
        <Button
            size="sm"
            variant="secondary"
            loading={refreshing}
            onclick={manualRefresh}>Refresh</Button
        >
    </div>

    {#if list === null}
        <div class="space-y-2">
            <Skeleton height="28px" />
            <Skeleton height="28px" />
        </div>
    {:else if list.length === 0}
        <EmptyState
            heading="No VPS found"
            description="This account has no virtual machines."
        />
    {:else}
        <ul class="divide-y divide-vscode-border">
            {#each list as v (v.id)}
                <li
                    class="flex items-center gap-3 py-2 hover:bg-vscode-list-hover px-2 -mx-2 rounded"
                >
                    <StatusDot
                        state={mapState(v.state)}
                        label={v.state}
                    />
                    <div class="min-w-0 flex-1">
                        <div class="text-sm font-medium truncate">
                            {v.hostname}
                        </div>
                        <div
                            class="text-[11px] text-vscode-description font-mono truncate"
                        >
                            {primaryIp(v) ?? "—"} · {v.plan ?? "—"}
                        </div>
                    </div>
                    {#if v.id === activeId}
                        <Badge tone="info">Default</Badge>
                    {:else}
                        <Button
                            size="sm"
                            variant="ghost"
                            onclick={() => setDefault(v)}
                            >Set as default</Button
                        >
                    {/if}
                </li>
            {/each}
        </ul>
    {/if}
</Card>
