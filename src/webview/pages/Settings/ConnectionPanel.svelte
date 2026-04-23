<script lang="ts">
    import { onMount } from "svelte";
    import { replace } from "svelte-spa-router";
    import Card from "../../lib/ui/Card.svelte";
    import Button from "../../lib/ui/Button.svelte";
    import Skeleton from "../../lib/ui/Skeleton.svelte";
    import { host } from "../../lib/host";
    import { toasts } from "../../lib/ui/toastStore";

    let masked = $state<string | null | undefined>(undefined);
    let testing = $state(false);

    async function load(): Promise<void> {
        try {
            masked = await host().request("getTokenMasked");
        } catch {
            masked = null;
        }
    }

    onMount(() => {
        void load();
    });

    function updateToken(): void {
        replace("/onboarding");
    }

    async function testConnection(): Promise<void> {
        testing = true;
        try {
            const result = await host().request("testConnection");
            if (result.ok) {
                toasts.success(
                    `Connection OK — ${result.count} VPS${result.count === 1 ? "" : "s"} reachable`,
                );
            } else {
                toasts.error(`Connection failed: ${result.error}`);
            }
        } catch (err) {
            toasts.error(
                err instanceof Error ? err.message : "Connection failed",
            );
        } finally {
            testing = false;
        }
    }
</script>

<Card>
    <div class="space-y-3">
        <div>
            <div class="text-[10px] uppercase text-vscode-description mb-1">
                API Token
            </div>
            {#if masked === undefined}
                <Skeleton height="20px" width="160px" />
            {:else if masked === null}
                <span class="text-xs text-vscode-description"
                    >Not connected</span
                >
            {:else}
                <span class="font-mono text-sm">{masked}</span>
            {/if}
        </div>

        <div class="flex gap-2">
            <Button size="sm" variant="secondary" onclick={updateToken}
                >Update token</Button
            >
            <Button
                size="sm"
                variant="primary"
                loading={testing}
                onclick={testConnection}>Test connection</Button
            >
        </div>
    </div>
</Card>
