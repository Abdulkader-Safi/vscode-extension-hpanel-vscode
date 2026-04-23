<script lang="ts">
    import { onMount } from "svelte";
    import { host } from "../lib/host";
    import IdentityBar from "./Overview/IdentityBar.svelte";
    import MetricsPanel from "./Overview/MetricsPanel.svelte";
    import ActionsLog from "./Overview/ActionsLog.svelte";
    import SshCard from "./Overview/SshCard.svelte";
    import Skeleton from "../lib/ui/Skeleton.svelte";
    import EmptyState from "../lib/ui/EmptyState.svelte";
    import { toasts } from "../lib/ui/toastStore";
    import type { Vps } from "../../api/types";

    let vps = $state<Vps | null | undefined>(undefined);
    let loadError = $state<string | null>(null);

    async function load(): Promise<void> {
        try {
            const result = await host().request("getActiveVps");
            vps = result;
            loadError = null;
        } catch (err) {
            vps = null;
            loadError =
                err instanceof Error ? err.message : "Could not load VPS";
            toasts.error(loadError);
        }
    }

    onMount(() => {
        void load();
        const off = host().on("preferenceChanged", ({ key }) => {
            if (key === "activeVpsId") {
                void load();
            }
        });
        return off;
    });
</script>

{#if vps === undefined}
    <div class="p-4 space-y-3">
        <Skeleton height="80px" />
        <Skeleton height="200px" />
        <Skeleton height="120px" />
    </div>
{:else if vps === null}
    <div class="p-4">
        <EmptyState
            heading={loadError ? "Couldn't load VPS" : "No VPS found"}
            description={loadError ?? "This account has no virtual machines."}
        />
    </div>
{:else}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        <div class="lg:col-span-3">
            <IdentityBar {vps} onaction={load} />
        </div>
        <div class="lg:col-span-2">
            <MetricsPanel {vps} />
        </div>
        <div class="lg:col-span-1">
            <SshCard {vps} />
        </div>
        <div class="lg:col-span-3">
            <ActionsLog vpsId={vps.id} />
        </div>
        <!-- DEBUG: temporary panel showing the raw VPS payload so we can
             align the api/types.ts shape against the real Hostinger API.
             Remove once types are confirmed. -->
        <div class="lg:col-span-3">
            <details
                class="text-xs text-vscode-description bg-vscode-code-bg border border-vscode-border rounded p-3"
            >
                <summary class="cursor-pointer">
                    DEBUG — raw VPS payload (remove before release)
                </summary>
                <pre class="mt-2 overflow-auto font-mono text-[11px]">{JSON.stringify(
                        vps,
                        null,
                        2,
                    )}</pre>
            </details>
        </div>
    </div>
{/if}
