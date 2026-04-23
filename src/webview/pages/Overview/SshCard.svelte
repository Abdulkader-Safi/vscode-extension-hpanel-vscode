<script lang="ts">
    import { link } from "svelte-spa-router";
    import Card from "../../lib/ui/Card.svelte";
    import Button from "../../lib/ui/Button.svelte";
    import Skeleton from "../../lib/ui/Skeleton.svelte";
    import { pollable } from "../../lib/poll";
    import { host } from "../../lib/host";
    import { toasts } from "../../lib/ui/toastStore";
    import { buildSshCommand } from "../../lib/sshCommand";
    import { primaryIp } from "../../lib/vpsFields";
    import type { Vps, PublicKey } from "../../../api/types";

    interface Props {
        vps: Vps;
    }

    let { vps }: Props = $props();

    const cmd = $derived(buildSshCommand(primaryIp(vps)));

    let keys = $state<PublicKey[] | null>(null);
    let keysLoading = $state(true);

    $effect(() => {
        const id = vps.id;
        const p = pollable<PublicKey[]>(
            `vps:keys:${id}`,
            () => host().request("getAttachedKeys", { id }),
            { intervalMs: 5 * 60_000 },
        );
        const unsub = p.subscribe((s) => {
            keys = s.data;
            keysLoading = s.loading;
        });
        return () => {
            unsub();
            p.dispose();
        };
    });

    async function copy(): Promise<void> {
        if (!cmd) {
            return;
        }
        try {
            await navigator.clipboard.writeText(cmd);
            toasts.success("Copied SSH command");
        } catch {
            toasts.error("Could not copy to clipboard");
        }
    }

    function openTerminal(): void {
        if (!cmd) {
            return;
        }
        void host()
            .request("openTerminal", { command: cmd, name: vps.hostname })
            .catch(() => toasts.error("Could not open terminal"));
    }

    function shortFingerprint(fp: string): string {
        if (fp.length <= 24) {
            return fp;
        }
        return `${fp.slice(0, 16)}…${fp.slice(-6)}`;
    }
</script>

<Card>
    <h3
        class="text-xs font-semibold uppercase tracking-wide text-vscode-description mb-2"
    >
        Quick SSH
    </h3>

    {#if cmd}
        <div
            class="font-mono text-sm bg-vscode-code-bg border border-vscode-border rounded px-2 py-1 break-all mb-2"
        >
            {cmd}
        </div>

        <div class="flex gap-2 mb-3">
            <Button size="sm" variant="secondary" onclick={copy}>Copy</Button>
            <Button size="sm" variant="primary" onclick={openTerminal}>
                Open in terminal
            </Button>
        </div>
    {:else}
        <p class="text-xs text-vscode-description mb-3">
            No IP address available for this VPS.
        </p>
    {/if}

    <div>
        <h4 class="text-[10px] uppercase text-vscode-description mb-1">
            Attached keys
        </h4>
        {#if keys === null && keysLoading}
            <Skeleton height="20px" />
        {:else if !keys || keys.length === 0}
            <p class="text-xs text-vscode-description">
                No keys attached.
                <a use:link href="/settings" class="text-vscode-link"
                    >Manage in Settings</a
                >
            </p>
        {:else}
            <ul class="text-xs divide-y divide-vscode-border">
                {#each keys as k (k.id)}
                    <li class="py-1.5 flex items-center justify-between gap-2">
                        <span class="truncate">{k.name ?? "—"}</span>
                        <span class="font-mono text-vscode-description"
                            >{shortFingerprint(k.fingerprint ?? "")}</span
                        >
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
</Card>
