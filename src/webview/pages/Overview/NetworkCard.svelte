<script lang="ts">
    import Card from "../../lib/ui/Card.svelte";
    import Sparkline from "../../lib/ui/Sparkline.svelte";
    import Skeleton from "../../lib/ui/Skeleton.svelte";
    import {
        latestValue,
        timeSeriesEntries,
        formatBytes,
    } from "../../lib/metrics";
    import type { VpsMetricSeries } from "../../../api/types";

    interface Props {
        inSeries: VpsMetricSeries | undefined;
        outSeries: VpsMetricSeries | undefined;
        unavailable?: boolean;
    }

    let { inSeries, outSeries, unavailable = false }: Props = $props();

    const inValue = $derived(latestValue(inSeries));
    const outValue = $derived(latestValue(outSeries));

    // Combine in + out by timestamp for the sparkline. Use a plain object
    // keyed by timestamp so out-of-order series still align point-by-point.
    const combined = $derived.by(() => {
        const merged: Record<number, number> = {};
        for (const e of timeSeriesEntries(inSeries)) {
            merged[e.ts] = (merged[e.ts] ?? 0) + e.value;
        }
        for (const e of timeSeriesEntries(outSeries)) {
            merged[e.ts] = (merged[e.ts] ?? 0) + e.value;
        }
        const sorted = Object.entries(merged)
            .map(([k, v]) => [Number(k), v] as const)
            .sort((a, b) => a[0] - b[0]);
        return {
            timestamps: sorted.map(([t]) => t),
            values: sorted.map(([, v]) => v),
        };
    });

    const formatBytesValue = (v: number): string => formatBytes(v);
</script>

<Card>
    <h3
        class="text-xs font-semibold uppercase tracking-wide text-vscode-description"
    >
        Network
    </h3>

    {#if unavailable}
        <p class="mt-2 text-xs text-vscode-description">
            Not available from API
        </p>
    {:else if !inSeries && !outSeries}
        <div class="mt-2"><Skeleton height="48px" /></div>
    {:else}
        <div class="mt-2">
            <div class="flex items-end gap-3">
                <div class="text-xs">
                    <div class="text-vscode-description">In</div>
                    <div class="font-mono text-sm">{formatBytes(inValue)}</div>
                </div>
                <div class="text-xs">
                    <div class="text-vscode-description">Out</div>
                    <div class="font-mono text-sm">{formatBytes(outValue)}</div>
                </div>
                <div class="ml-auto">
                    <Sparkline
                        data={combined.values}
                        timestamps={combined.timestamps}
                        formatValue={formatBytesValue}
                    />
                </div>
            </div>
        </div>
    {/if}
</Card>
