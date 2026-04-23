<script lang="ts">
    import Card from "../../lib/ui/Card.svelte";
    import Skeleton from "../../lib/ui/Skeleton.svelte";
    import { exceeds } from "../../lib/thresholds";
    import { latestValue, formatBytes, pctOf } from "../../lib/metrics";
    import type { VpsMetricSeries } from "../../../api/types";

    interface Props {
        series: VpsMetricSeries | undefined;
        totalBytes?: number;
        threshold?: number;
        label?: string;
    }

    let { series, totalBytes, threshold, label = "RAM" }: Props = $props();

    const usedBytes = $derived(latestValue(series));
    const pct = $derived(pctOf(usedBytes, totalBytes));
    const warn = $derived(exceeds(pct, threshold));
</script>

<Card>
    <div class="flex items-start justify-between gap-2">
        <h3
            class="text-xs font-semibold uppercase tracking-wide text-vscode-description"
        >
            {label}
        </h3>
        {#if warn}
            <span
                class="text-[10px] font-semibold uppercase text-vscode-warning"
            >
                Over threshold
            </span>
        {/if}
    </div>

    {#if !series}
        <div class="mt-2"><Skeleton height="48px" /></div>
    {:else}
        <div class="mt-2">
            <div
                class="text-2xl font-semibold {warn
                    ? 'text-vscode-warning'
                    : ''}"
            >
                {pct !== undefined ? pct.toFixed(0) : "—"}<span
                    class="text-sm text-vscode-description ml-0.5">%</span
                >
            </div>
            <div class="text-[11px] text-vscode-description font-mono mt-0.5">
                {formatBytes(usedBytes)} / {formatBytes(totalBytes)}
            </div>
            <div
                class="mt-2 h-1.5 rounded bg-vscode-list-hover overflow-hidden"
            >
                <div
                    class="h-full transition-all {warn
                        ? 'bg-vscode-warning'
                        : 'bg-vscode-fg/60'}"
                    style:width="{pct ?? 0}%"
                ></div>
            </div>
        </div>
    {/if}
</Card>
