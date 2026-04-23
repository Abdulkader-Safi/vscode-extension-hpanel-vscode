<script lang="ts">
    import { pollable } from "../../lib/poll";
    import { host } from "../../lib/host";
    import { preferences } from "../../lib/preferences";
    import CpuCard from "./CpuCard.svelte";
    import RamCard from "./RamCard.svelte";
    import NetworkCard from "./NetworkCard.svelte";
    import UptimeCard from "./UptimeCard.svelte";
    import { mbToBytes, pickSeries } from "../../lib/metrics";
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

    // Confirmed key names from a real Hostinger metrics response (Apr 2026):
    // disk_space, incoming_traffic, outgoing_traffic. Speculative fallbacks
    // are kept defensively in case the API renames in the future.
    const DISK_KEYS = [
        "disk_space",
        "disk_usage",
        "disk_space_usage",
        "storage_usage",
    ] as const;
    const NET_IN_KEYS = [
        "incoming_traffic",
        "network_in_usage",
        "network_inbound_usage",
        "bandwidth_inbound",
        "traffic_in",
        "network_in",
    ] as const;
    const NET_OUT_KEYS = [
        "outgoing_traffic",
        "network_out_usage",
        "network_outbound_usage",
        "bandwidth_outbound",
        "traffic_out",
        "network_out",
    ] as const;

    const cpuSeries = $derived(metrics?.cpu_usage);
    const ramSeries = $derived(metrics?.ram_usage);
    const diskSeries = $derived(pickSeries(metrics, DISK_KEYS));
    const netInSeries = $derived(pickSeries(metrics, NET_IN_KEYS));
    const netOutSeries = $derived(pickSeries(metrics, NET_OUT_KEYS));

    // "unavailable" only fires after metrics loaded but no candidate matched.
    // While metrics is null (loading), the card stays in Skeleton state.
    const diskUnavailable = $derived(metrics !== null && !diskSeries);
    const networkUnavailable = $derived(
        metrics !== null && !netInSeries && !netOutSeries,
    );

    const availableKeys = $derived(
        metrics ? Object.keys(metrics).join(", ") || "(none)" : "(loading)",
    );
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
        <CpuCard series={cpuSeries} threshold={thresholds?.cpu} />
        <RamCard
            series={ramSeries}
            totalBytes={memoryBytes}
            threshold={thresholds?.ram}
            label="RAM"
        />
        <RamCard
            series={diskSeries}
            totalBytes={diskBytes}
            threshold={thresholds?.disk}
            label="Disk"
            unavailable={diskUnavailable}
        />
        <NetworkCard
            inSeries={netInSeries}
            outSeries={netOutSeries}
            unavailable={networkUnavailable}
        />
        <div class="col-span-2">
            <UptimeCard series={metrics?.uptime} />
        </div>
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
    <div class="text-[11px] mt-2">
        Available keys: <span class="font-mono">{availableKeys}</span>
    </div>
    <pre class="mt-2 overflow-auto font-mono text-[11px]">{error
            ? `ERROR: ${error.message}`
            : JSON.stringify(metrics, null, 2)}</pre>
</details>
