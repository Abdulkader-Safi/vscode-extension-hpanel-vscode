<script lang="ts">
    import Card from "../../lib/ui/Card.svelte";
    import Sparkline from "../../lib/ui/Sparkline.svelte";
    import Skeleton from "../../lib/ui/Skeleton.svelte";
    import {
        latestValue,
        timeSeriesValues,
        timeSeriesTimestamps,
        formatDuration,
    } from "../../lib/metrics";
    import type { VpsMetricSeries } from "../../../api/types";

    interface Props {
        series: VpsMetricSeries | undefined;
    }

    let { series }: Props = $props();

    const seconds = $derived(latestValue(series));
    const history = $derived(timeSeriesValues(series));
    const timestamps = $derived(timeSeriesTimestamps(series));

    const bootedAt = $derived.by(() => {
        if (seconds === undefined) {
            return "—";
        }
        const d = new Date(Date.now() - seconds * 1000);
        if (Number.isNaN(d.getTime())) {
            return "—";
        }
        return d.toLocaleString();
    });

    const formatSeconds = (v: number): string => formatDuration(v);
</script>

<Card>
    <h3
        class="text-xs font-semibold uppercase tracking-wide text-vscode-description"
    >
        Uptime
    </h3>

    {#if !series}
        <div class="mt-2"><Skeleton height="48px" /></div>
    {:else}
        <div class="mt-2 flex items-end justify-between gap-3">
            <div>
                <div class="text-2xl font-semibold">
                    {formatDuration(seconds)}
                </div>
                <div class="text-[11px] text-vscode-description mt-0.5">
                    up since <span class="font-mono">{bootedAt}</span>
                </div>
            </div>
            <Sparkline
                data={history}
                {timestamps}
                formatValue={formatSeconds}
            />
        </div>
    {/if}
</Card>
