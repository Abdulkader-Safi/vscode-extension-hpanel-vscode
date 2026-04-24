<script lang="ts">
    import Button from "../../lib/ui/Button.svelte";
    import Card from "../../lib/ui/Card.svelte";
    import EmptyState from "../../lib/ui/EmptyState.svelte";
    import Skeleton from "../../lib/ui/Skeleton.svelte";
    import RestoreBackupModal from "./RestoreBackupModal.svelte";
    import { host } from "../../lib/host";
    import { toasts } from "../../lib/ui/toastStore";
    import { formatTimestamp, relativeTime } from "../../lib/time";
    import type { Backup } from "../../../api/types";

    interface Props {
        vpsId: number;
        hostname: string;
    }

    let { vpsId, hostname }: Props = $props();

    let backups = $state<Backup[] | undefined>(undefined);
    let error = $state<string | null>(null);
    let selected = $state<Backup | null>(null);

    async function load(): Promise<void> {
        try {
            backups = await host().request("listBackups", { vpsId });
            error = null;
        } catch (err) {
            error = err instanceof Error ? err.message : "Could not load backups";
            backups = [];
        }
    }

    $effect(() => {
        void vpsId;
        backups = undefined;
        void load();
    });

    function openRestore(b: Backup): void {
        if (!hostname) {
            toasts.error("VPS hostname unavailable — cannot confirm restore.");
            return;
        }
        selected = b;
    }
</script>

<section>
    <div class="flex items-center justify-between mb-2">
        <h3
            class="text-xs font-semibold uppercase tracking-wide text-vscode-description"
        >
            Automated weekly backups
        </h3>
        <!--
            TODO(phase-6): Hostinger API endpoint for backup-schedule toggle
            is not yet wired into HostingerClient. Add when verified against
            the public API docs.
        -->
    </div>

    {#if backups === undefined}
        <Skeleton height="120px" />
    {:else if error}
        <Card>
            <div class="text-xs text-vscode-error" role="alert">{error}</div>
        </Card>
    {:else if backups.length === 0}
        <Card>
            <EmptyState
                heading="No backups yet"
                description="Hostinger runs automated weekly backups for supported plans. They'll appear here once the first one completes."
            />
        </Card>
    {:else}
        <Card padded={false}>
            <ul class="divide-y divide-vscode-border">
                {#each backups as b (b.id)}
                    <li
                        class="flex items-center justify-between gap-4 px-4 py-2"
                    >
                        <div class="min-w-0">
                            <div class="text-sm">
                                {formatTimestamp(b.created_at)}
                            </div>
                            <div class="text-xs text-vscode-description">
                                {relativeTime(b.created_at)}
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onclick={() => openRestore(b)}
                        >
                            Restore
                        </Button>
                    </li>
                {/each}
            </ul>
        </Card>
    {/if}
</section>

<RestoreBackupModal
    open={selected !== null}
    {vpsId}
    {hostname}
    backup={selected}
    onclose={() => (selected = null)}
/>
