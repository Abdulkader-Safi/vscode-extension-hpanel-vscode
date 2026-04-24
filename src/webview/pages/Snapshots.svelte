<script lang="ts">
    import { onMount } from "svelte";
    import EmptyState from "../lib/ui/EmptyState.svelte";
    import Skeleton from "../lib/ui/Skeleton.svelte";
    import ManualSnapshot from "./Snapshots/ManualSnapshot.svelte";
    import BackupList from "./Snapshots/BackupList.svelte";
    import { host } from "../lib/host";
    import { toasts } from "../lib/ui/toastStore";
    import type { Vps } from "../../api/types";

    let vps = $state<Vps | null | undefined>(undefined);

    async function loadVps(): Promise<void> {
        try {
            vps = await host().request("getActiveVps");
        } catch (err) {
            vps = null;
            toasts.error(
                err instanceof Error ? err.message : "Could not load VPS",
            );
        }
    }

    onMount(() => {
        void loadVps();

        const off = host().on("preferenceChanged", ({ key }) => {
            if (key === "activeVpsId") {
                vps = undefined;
                void loadVps();
            }
        });

        return () => {
            off();
        };
    });
</script>

{#if vps === undefined}
    <div class="p-4 space-y-3">
        <Skeleton height="80px" />
        <Skeleton height="200px" />
    </div>
{:else if vps === null}
    <div class="p-4">
        <EmptyState
            heading="No VPS selected"
            description="Pick a VPS from the top-nav selector."
        />
    </div>
{:else}
    <div class="p-4 space-y-6">
        <div>
            <h2 class="text-lg font-semibold mb-3">Snapshots & backups</h2>
            <p class="text-xs text-vscode-description">
                Snapshots are manual, one-at-a-time restore points. Backups are
                automated weekly copies managed by Hostinger.
            </p>
        </div>

        <ManualSnapshot vpsId={vps.id} />

        <BackupList vpsId={vps.id} hostname={vps.hostname} />
    </div>
{/if}
