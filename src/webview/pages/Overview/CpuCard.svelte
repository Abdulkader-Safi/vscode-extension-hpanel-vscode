<script lang="ts">
    import Card from "../../lib/ui/Card.svelte";
    import Sparkline from "../../lib/ui/Sparkline.svelte";
    import Skeleton from "../../lib/ui/Skeleton.svelte";
    import { exceeds } from "../../lib/thresholds";
    import {
        latestValue,
        timeSeriesValues,
        timeSeriesTimestamps,
    } from "../../lib/metrics";
    import type { VpsMetricSeries } from "../../../api/types";

    interface Props {
        series: VpsMetricSeries | undefined;
        threshold?: number;
    }

    let { series, threshold }: Props = $props();

    const value = $derived(latestValue(series));
    const history = $derived(timeSeriesValues(series));
    const timestamps = $derived(timeSeriesTimestamps(series));
    const warn = $derived(exceeds(value, threshold));
    const dailyAverage = $derived.by(() => {
        if (history.length === 0) {
            return undefined;
        }
        return history.reduce((a, b) => a + b, 0) / history.length;
    });

    const formatPct = (v: number): string => `${v.toFixed(2)} %`;
</script>

<Card>
    <div class="flex items-start justify-between gap-2">
        <h3
            class="text-xs font-semibold uppercase tracking-wide text-vscode-description"
        >
            CPU
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
            <div class="flex items-end justify-between gap-3">
                <div
                    class="text-2xl font-semibold {warn
                        ? 'text-vscode-warning'
                        : ''}"
                >
                    {value?.toFixed(1) ?? "—"}<span
                        class="text-sm text-vscode-description ml-0.5">%</span
                    >
                </div>
                <Sparkline
                    data={history}
                    {timestamps}
                    tone={warn ? "warning" : "neutral"}
                    formatValue={formatPct}
                />
            </div>
            {#if dailyAverage !== undefined}
                <div class="text-[10px] text-vscode-description mt-1">
                    avg {dailyAverage.toFixed(1)}%
                </div>
            {/if}
        </div>
    {/if}
</Card>
