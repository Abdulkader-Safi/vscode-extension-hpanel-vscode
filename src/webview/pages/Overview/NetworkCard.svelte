<script lang="ts">
    import Card from "../../lib/ui/Card.svelte";
    import Sparkline from "../../lib/ui/Sparkline.svelte";
    import Skeleton from "../../lib/ui/Skeleton.svelte";
    import {
        latestValue,
        timeSeriesValues,
        formatBytes,
    } from "../../lib/metrics";
    import type { VpsMetricSeries } from "../../../api/types";

    interface Props {
        inSeries: VpsMetricSeries | undefined;
        outSeries: VpsMetricSeries | undefined;
    }

    let { inSeries, outSeries }: Props = $props();

    const inValue = $derived(latestValue(inSeries));
    const outValue = $derived(latestValue(outSeries));

    // Combined sparkline: sum of in + out per timestamp (or whichever is present).
    const sparkData = $derived.by(() => {
        const inHist = timeSeriesValues(inSeries);
        const outHist = timeSeriesValues(outSeries);
        const len = Math.max(inHist.length, outHist.length);
        const out: number[] = [];
        for (let i = 0; i < len; i++) {
            out.push((inHist[i] ?? 0) + (outHist[i] ?? 0));
        }
        return out;
    });

</script>

<Card>
    <h3
        class="text-xs font-semibold uppercase tracking-wide text-vscode-description"
    >
        Network
    </h3>

    {#if !inSeries && !outSeries}
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
                    <Sparkline data={sparkData} />
                </div>
            </div>
        </div>
    {/if}
</Card>
