<script lang="ts">
    import { pollable } from "../../lib/poll";
    import { host } from "../../lib/host";
    import { preferences } from "../../lib/preferences";
    import CpuCard from "./CpuCard.svelte";
    import RamCard from "./RamCard.svelte";
    import NetworkCard from "./NetworkCard.svelte";
    import { mbToBytes } from "../../lib/metrics";
    import type { Vps, VpsMetrics } from "../../../api/types";

    interface Props {
        vps: Vps;
    }

    let { vps }: Props = $props();

    const intervalMs = $derived($preferences?.pollingIntervalMs ?? 60_000);
    const thresholds = $derived($preferences?.thresholds);

    let metrics = $state<VpsMetrics | null>(null);
    let error = $state<Error | null>(null);

    $effect(() => {
        const id = vps.id;
        const ms = intervalMs;
        const p = pollable<VpsMetrics>(
            `vps:metrics:${id}`,
            () => host().request("getVpsMetrics", { id }),
            { intervalMs: ms },
        );
        const unsub = p.subscribe((s) => {
            metrics = s.data;
            error = s.error;
        });
        return () => {
            unsub();
            p.dispose();
        };
    });

    const memoryBytes = $derived(mbToBytes(vps.memory));
    const diskBytes = $derived(mbToBytes(vps.disk));
</script>

{#if error}
    <div
        class="border border-vscode-error/40 bg-vscode-error/10 text-vscode-error text-xs rounded p-3"
        role="alert"
    >
        Couldn't load metrics: {error.message}
    </div>
{:else}
    <div class="grid grid-cols-2 gap-3">
        <CpuCard series={metrics?.cpu_usage} threshold={thresholds?.cpu} />
        <RamCard
            series={metrics?.ram_usage}
            totalBytes={memoryBytes}
            threshold={thresholds?.ram}
            label="RAM"
        />
        <RamCard
            series={metrics?.disk_usage}
            totalBytes={diskBytes}
            threshold={thresholds?.disk}
            label="Disk"
        />
        <NetworkCard
            inSeries={metrics?.network_in_usage}
            outSeries={metrics?.network_out_usage}
        />
    </div>
{/if}

<!-- DEBUG: temporary panel showing the raw metrics payload so we can
     align the api/types.ts shape against the real Hostinger API.
     Remove once types are confirmed. -->
<details
    class="mt-3 text-xs text-vscode-description bg-vscode-code-bg border border-vscode-border rounded p-3"
>
    <summary class="cursor-pointer">
        DEBUG — raw metrics payload (remove before release)
    </summary>
    <pre class="mt-2 overflow-auto font-mono text-[11px]">{error
            ? `ERROR: ${error.message}`
            : JSON.stringify(metrics, null, 2)}</pre>
</details>
