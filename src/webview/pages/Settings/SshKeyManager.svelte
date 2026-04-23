<script lang="ts">
    import { onMount } from "svelte";
    import Card from "../../lib/ui/Card.svelte";
    import Button from "../../lib/ui/Button.svelte";
    import ConfirmInline from "../../lib/ui/ConfirmInline.svelte";
    import EmptyState from "../../lib/ui/EmptyState.svelte";
    import Skeleton from "../../lib/ui/Skeleton.svelte";
    import { host } from "../../lib/host";
    import { toasts } from "../../lib/ui/toastStore";
    import type { PublicKey } from "../../../api/types";
    import type { LocalSshKey } from "../../../messaging/contract";

    let accountKeys = $state<PublicKey[] | null>(null);
    let localKeys = $state<LocalSshKey[] | null>(null);
    let nameInputs = $state<Record<string, string>>({});
    let registering = $state<string | null>(null);

    async function loadAccountKeys(): Promise<void> {
        try {
            accountKeys = await host().request("listAccountKeys");
        } catch (err) {
            toasts.error(
                err instanceof Error
                    ? err.message
                    : "Could not load account keys",
            );
            accountKeys = [];
        }
    }

    async function loadLocalKeys(): Promise<void> {
        try {
            const list = await host().request("scanSshKeys");
            localKeys = list;
            for (const k of list) {
                if (nameInputs[k.path] === undefined) {
                    nameInputs[k.path] = k.name;
                }
            }
        } catch {
            localKeys = [];
        }
    }

    onMount(() => {
        void loadAccountKeys();
        void loadLocalKeys();
    });

    async function deleteKey(id: number): Promise<void> {
        try {
            await host().request("deleteAccountKey", { id });
            toasts.success("Key deleted");
            await loadAccountKeys();
        } catch (err) {
            toasts.error(err instanceof Error ? err.message : "Delete failed");
        }
    }

    async function registerKey(local: LocalSshKey): Promise<void> {
        const name = (nameInputs[local.path] ?? local.name).trim();
        if (!name) {
            toasts.warning("Name required");
            return;
        }
        registering = local.path;
        try {
            await host().request("createAccountKey", {
                name,
                key: local.key,
            });
            toasts.success(`Registered ${name}`);
            await loadAccountKeys();
        } catch (err) {
            toasts.error(
                err instanceof Error ? err.message : "Register failed",
            );
        } finally {
            registering = null;
        }
    }

    function shortFp(fp: string): string {
        return fp.length > 24 ? `${fp.slice(0, 16)}…${fp.slice(-6)}` : fp;
    }

    const inputCls =
        "w-full mt-1 px-2 py-1 text-xs bg-vscode-input-bg text-vscode-input-fg border border-vscode-input-border rounded focus:outline-none focus:ring-1 focus:ring-vscode-focus";
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
    <Card>
        <h3
            class="text-xs font-semibold uppercase tracking-wide text-vscode-description mb-2"
        >
            Account keys
        </h3>
        {#if accountKeys === null}
            <Skeleton height="20px" />
        {:else if accountKeys.length === 0}
            <EmptyState
                heading="No account keys"
                description="Register a local key to start."
            />
        {:else}
            <ul class="text-xs divide-y divide-vscode-border">
                {#each accountKeys as k (k.id)}
                    <li class="py-2 flex items-center gap-2">
                        <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium truncate">
                                {k.name}
                            </div>
                            <div
                                class="font-mono text-[10px] text-vscode-description"
                            >
                                {shortFp(k.fingerprint)}
                            </div>
                        </div>
                        <ConfirmInline
                            label="Delete"
                            size="sm"
                            variant="danger"
                            onconfirm={() => deleteKey(k.id)}
                        />
                    </li>
                {/each}
            </ul>
        {/if}
    </Card>

    <Card>
        <h3
            class="text-xs font-semibold uppercase tracking-wide text-vscode-description mb-2"
        >
            Local keys (~/.ssh/*.pub)
        </h3>
        {#if localKeys === null}
            <Skeleton height="20px" />
        {:else if localKeys.length === 0}
            <EmptyState
                heading="No local public keys"
                description="Generate one with `ssh-keygen -t ed25519` to start."
            />
        {:else}
            <ul class="text-xs divide-y divide-vscode-border">
                {#each localKeys as k (k.path)}
                    <li class="py-2 flex items-start gap-2">
                        <div class="flex-1 min-w-0">
                            <div
                                class="font-mono text-[10px] text-vscode-description truncate"
                            >
                                {k.path}
                            </div>
                            <div
                                class="font-mono text-[10px] text-vscode-description truncate"
                            >
                                {shortFp(k.fingerprint)}
                            </div>
                            <input
                                type="text"
                                bind:value={nameInputs[k.path]}
                                placeholder="Key name"
                                class={inputCls}
                            />
                        </div>
                        <Button
                            size="sm"
                            loading={registering === k.path}
                            onclick={() => registerKey(k)}
                        >
                            Register
                        </Button>
                    </li>
                {/each}
            </ul>
        {/if}
    </Card>
</div>
