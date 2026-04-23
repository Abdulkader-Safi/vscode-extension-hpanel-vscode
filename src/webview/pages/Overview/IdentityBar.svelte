<script lang="ts">
    import Card from "../../lib/ui/Card.svelte";
    import StatusDot from "../../lib/ui/StatusDot.svelte";
    import ConfirmInline from "../../lib/ui/ConfirmInline.svelte";
    import { host } from "../../lib/host";
    import { toasts } from "../../lib/ui/toastStore";
    import { primaryIp, osName, formatMemoryMb } from "../../lib/vpsFields";
    import type { Vps, VpsState } from "../../../api/types";
    import type { VpsActionKind } from "../../../messaging/contract";

    interface Props {
        vps: Vps;
        onaction?: () => void;
    }

    let { vps, onaction }: Props = $props();

    function mapState(
        s: VpsState,
    ): "running" | "stopped" | "error" | "unknown" {
        if (s === "running") {
            return "running";
        }
        if (s === "stopped") {
            return "stopped";
        }
        if (s === "starting" || s === "stopping") {
            return "unknown";
        }
        return "unknown";
    }

    function formatDate(iso: string | undefined): string {
        if (!iso) {
            return "—";
        }
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) {
            return iso;
        }
        return d.toLocaleDateString();
    }

    const ip = $derived(primaryIp(vps));
    const os = $derived(osName(vps));
    const cpus = $derived(vps.cpus ? `${vps.cpus} vCPU` : "—");
    const ram = $derived(formatMemoryMb(vps.memory));
    const disk = $derived(formatMemoryMb(vps.disk));

    async function trigger(action: VpsActionKind): Promise<void> {
        try {
            await host().request("vpsAction", { id: vps.id, action });
            toasts.success(`${action} requested`);
            onaction?.();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : `Failed to ${action} VPS`;
            toasts.error(message);
        }
    }
</script>

<Card>
    <div class="flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
                <h2 class="text-xl font-semibold truncate">{vps.hostname}</h2>
                <StatusDot state={mapState(vps.state)} label={vps.state} />
            </div>
            <div class="text-xs font-mono text-vscode-description mt-1">
                {ip ?? "No IP"}
            </div>
            <div
                class="text-xs text-vscode-description mt-1 flex flex-wrap gap-x-2"
            >
                <span>{os}</span>
                <span aria-hidden="true">·</span>
                <span>{vps.plan ?? "—"}</span>
                <span aria-hidden="true">·</span>
                <span>{cpus}</span>
                <span aria-hidden="true">·</span>
                <span>{ram} RAM</span>
                <span aria-hidden="true">·</span>
                <span>{disk} disk</span>
                <span aria-hidden="true">·</span>
                <span>created {formatDate(vps.created_at)}</span>
            </div>
        </div>
        <div class="flex gap-2 shrink-0">
            <ConfirmInline
                label="Restart"
                size="sm"
                variant="secondary"
                onconfirm={() => trigger("restart")}
            />
            <ConfirmInline
                label="Stop"
                size="sm"
                variant="danger"
                onconfirm={() => trigger("stop")}
            />
            <ConfirmInline
                label="Recovery"
                size="sm"
                variant="secondary"
                onconfirm={() => trigger("recovery")}
            />
        </div>
    </div>
</Card>
