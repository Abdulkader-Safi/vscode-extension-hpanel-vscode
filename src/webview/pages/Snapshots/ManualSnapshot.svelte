<script lang="ts">
    import Button from "../../lib/ui/Button.svelte";
    import Card from "../../lib/ui/Card.svelte";
    import ConfirmInline from "../../lib/ui/ConfirmInline.svelte";
    import EmptyState from "../../lib/ui/EmptyState.svelte";
    import Skeleton from "../../lib/ui/Skeleton.svelte";
    import { host } from "../../lib/host";
    import { toasts } from "../../lib/ui/toastStore";
    import {
        formatBytes,
        formatTimestamp,
        relativeTime,
    } from "../../lib/time";
    import type { Snapshot } from "../../../api/types";

    interface Props {
        vpsId: number;
    }

    let { vpsId }: Props = $props();

    let snapshot = $state<Snapshot | null | undefined>(undefined);
    let error = $state<string | null>(null);
    let inFlight = $state<"create" | "restore" | "delete" | null>(null);

    async function load(): Promise<void> {
        try {
            snapshot = await host().request("getSnapshot", { vpsId });
            error = null;
        } catch (err) {
            error = err instanceof Error ? err.message : "Could not load snapshot";
            snapshot = null;
        }
    }

    async function createSnapshot(): Promise<void> {
        if (inFlight) {return;}
        inFlight = "create";
        try {
            await host().request("createSnapshot", { vpsId });
            toasts.success("Snapshot created");
            await load();
        } catch (err) {
            toasts.error(
                err instanceof Error ? err.message : "Snapshot failed",
            );
        } finally {
            inFlight = null;
        }
    }

    async function restoreSnapshot(): Promise<void> {
        if (inFlight) {return;}
        inFlight = "restore";
        try {
            await host().request("restoreSnapshot", { vpsId });
            toasts.success("Snapshot restore queued");
        } catch (err) {
            toasts.error(
                err instanceof Error ? err.message : "Restore failed",
            );
        } finally {
            inFlight = null;
        }
    }

    async function deleteSnapshot(): Promise<void> {
        if (inFlight) {return;}
        inFlight = "delete";
        try {
            await host().request("deleteSnapshot", { vpsId });
            toasts.success("Snapshot deleted");
            await load();
        } catch (err) {
            toasts.error(
                err instanceof Error ? err.message : "Delete failed",
            );
        } finally {
            inFlight = null;
        }
    }

    $effect(() => {
        // reload when vpsId changes
        void vpsId;
        snapshot = undefined;
        void load();
    });
</script>

<section>
    <h3
        class="text-xs font-semibold uppercase tracking-wide text-vscode-description mb-2"
    >
        Manual snapshot
    </h3>

    {#if snapshot === undefined}
        <Skeleton height="140px" />
    {:else if error}
        <Card>
            <div class="text-xs text-vscode-error" role="alert">{error}</div>
        </Card>
    {:else if snapshot === null}
        <Card>
            <EmptyState
                heading="No snapshot yet"
                description="A manual snapshot is a one-time restore point you can roll back to after a risky change."
            >
                {#snippet cta()}
                    <Button
                        variant="primary"
                        loading={inFlight === "create"}
                        onclick={createSnapshot}>Create snapshot</Button
                    >
                {/snippet}
            </EmptyState>
        </Card>
    {:else}
        <Card>
            <div class="flex items-start justify-between gap-4">
                <div class="min-w-0 space-y-1">
                    <div class="text-sm font-medium">
                        {formatTimestamp(snapshot.created_at)}
                    </div>
                    <div class="text-xs text-vscode-description">
                        {relativeTime(snapshot.created_at)}
                        {#if snapshot.size_bytes !== undefined}
                            · {formatBytes(snapshot.size_bytes)}
                        {/if}
                    </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <ConfirmInline
                        label="Restore"
                        confirmLabel="Restore this snapshot?"
                        variant="secondary"
                        size="sm"
                        disabled={inFlight !== null}
                        onconfirm={restoreSnapshot}
                    />
                    <ConfirmInline
                        label="Delete"
                        confirmLabel="Delete snapshot?"
                        variant="danger"
                        size="sm"
                        disabled={inFlight !== null}
                        onconfirm={deleteSnapshot}
                    />
                </div>
            </div>

            <div
                class="mt-3 border-t border-vscode-border pt-3 flex items-center justify-between gap-3"
            >
                <p class="text-xs text-vscode-description">
                    Creating a new snapshot will overwrite the existing one.
                </p>
                <ConfirmInline
                    label="Create new snapshot"
                    confirmLabel="Overwrite existing?"
                    variant="primary"
                    size="sm"
                    disabled={inFlight !== null}
                    onconfirm={createSnapshot}
                />
            </div>
        </Card>
    {/if}
</section>
