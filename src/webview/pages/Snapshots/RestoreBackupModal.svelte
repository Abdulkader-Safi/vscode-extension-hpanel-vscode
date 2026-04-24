<script lang="ts">
    import Modal from "../../lib/ui/Modal.svelte";
    import Button from "../../lib/ui/Button.svelte";
    import { host } from "../../lib/host";
    import { toasts } from "../../lib/ui/toastStore";
    import { formatTimestamp, relativeTime } from "../../lib/time";
    import { hostnameMatches } from "./hostnameMatch";
    import type { Backup } from "../../../api/types";

    interface Props {
        open: boolean;
        vpsId: number;
        hostname: string;
        backup: Backup | null;
        onclose: () => void;
        onrestored?: () => void;
    }

    let {
        open,
        vpsId,
        hostname,
        backup,
        onclose,
        onrestored,
    }: Props = $props();

    let typed = $state("");
    let submitting = $state(false);
    let error = $state<string | null>(null);

    const hostnameMatch = $derived(hostnameMatches(hostname, typed));
    const canSubmit = $derived(
        hostnameMatch && backup !== null && !submitting,
    );

    // Reset state every time the modal transitions from closed -> open.
    let wasOpen = false;
    $effect(() => {
        if (open && !wasOpen) {
            typed = "";
            error = null;
            submitting = false;
        }
        wasOpen = open;
    });

    async function submit(): Promise<void> {
        if (!canSubmit || !backup) {return;}
        submitting = true;
        error = null;
        try {
            await host().request("restoreBackup", {
                vpsId,
                backupId: backup.id,
            });
            toasts.success("Backup restore queued");
            onrestored?.();
            onclose();
        } catch (err) {
            error = err instanceof Error ? err.message : "Restore failed";
        } finally {
            submitting = false;
        }
    }

    const inputCls =
        "w-full px-2 py-1 text-sm bg-vscode-input-bg text-vscode-input-fg border border-vscode-input-border rounded focus:outline-none focus:ring-1 focus:ring-vscode-focus font-mono";
</script>

<Modal {open} title="Restore backup" {onclose}>
    <div class="space-y-3">
        <div
            class="border border-vscode-error/40 bg-vscode-error/10 text-vscode-error text-xs rounded p-2"
            role="alert"
        >
            <strong class="font-semibold">This is destructive.</strong>
            Restoring a backup overwrites all data on this VPS with the state
            from the backup. Anything written after the backup time will be
            lost.
        </div>

        {#if backup}
            <div class="text-xs">
                <div class="text-vscode-description uppercase mb-1">
                    Backup
                </div>
                <div class="text-sm">
                    {formatTimestamp(backup.created_at)}
                </div>
                <div class="text-xs text-vscode-description">
                    {relativeTime(backup.created_at)}
                </div>
            </div>
        {/if}

        <label class="flex flex-col gap-1 text-xs">
            <span class="text-vscode-description uppercase">
                Type the hostname to confirm:
                <span class="font-mono text-vscode-fg normal-case ml-1"
                    >{hostname}</span
                >
            </span>
            <input
                type="text"
                bind:value={typed}
                placeholder={hostname}
                class={inputCls}
                data-testid="hostname-input"
                autocomplete="off"
                spellcheck="false"
                aria-invalid={typed.length > 0 && !hostnameMatch}
            />
        </label>

        {#if error}
            <div
                class="border border-vscode-error/40 bg-vscode-error/10 text-vscode-error text-xs rounded p-2"
                role="alert"
            >
                {error}
            </div>
        {/if}
    </div>

    {#snippet footer()}
        <Button variant="ghost" onclick={onclose}>Cancel</Button>
        <Button
            variant="danger"
            disabled={!canSubmit}
            loading={submitting}
            onclick={submit}>Restore backup</Button
        >
    {/snippet}
</Modal>
