<script lang="ts">
    import Modal from "../../lib/ui/Modal.svelte";
    import Button from "../../lib/ui/Button.svelte";
    import { host } from "../../lib/host";
    import { toasts } from "../../lib/ui/toastStore";
    import { isValidDockerProjectName } from "../../lib/dockerName";

    interface Props {
        open: boolean;
        vpsId: number;
        onclose: () => void;
        oncreated: () => void;
    }

    let { open, vpsId, onclose, oncreated }: Props = $props();

    let name = $state("");
    let compose = $state("");
    let envPairs = $state<{ key: string; value: string }[]>([]);
    let submitting = $state(false);

    const nameValid = $derived(name === "" || isValidDockerProjectName(name));
    const canSubmit = $derived(
        isValidDockerProjectName(name) && compose.trim().length > 0 && !submitting,
    );

    function reset(): void {
        name = "";
        compose = "";
        envPairs = [];
    }

    function addEnv(): void {
        envPairs = [...envPairs, { key: "", value: "" }];
    }

    function removeEnv(i: number): void {
        envPairs = envPairs.filter((_, idx) => idx !== i);
    }

    async function submit(): Promise<void> {
        if (!canSubmit) {return;}
        submitting = true;
        try {
            const env: Record<string, string> = {};
            for (const p of envPairs) {
                const k = p.key.trim();
                if (!k) {continue;}
                env[k] = p.value;
            }
            await host().request("createDockerProject", {
                vpsId,
                name: name.trim(),
                compose,
                env: Object.keys(env).length > 0 ? env : undefined,
            });
            toasts.success(`Created ${name}`);
            reset();
            oncreated();
            onclose();
        } catch (err) {
            toasts.error(err instanceof Error ? err.message : "Create failed");
        } finally {
            submitting = false;
        }
    }

    const inputCls =
        "w-full px-2 py-1 text-sm bg-vscode-input-bg text-vscode-input-fg border border-vscode-input-border rounded focus:outline-none focus:ring-1 focus:ring-vscode-focus";
</script>

<Modal {open} title="New Docker project" {onclose}>
    <div class="space-y-3">
        <label class="flex flex-col gap-1 text-xs">
            <span class="text-vscode-description uppercase">Name</span>
            <input
                type="text"
                bind:value={name}
                placeholder="my-app"
                class={inputCls}
                aria-invalid={!nameValid}
            />
            {#if !nameValid}
                <span class="text-[11px] text-vscode-error">
                    Only letters, numbers, dashes, and underscores. Must start
                    with a letter or number.
                </span>
            {/if}
        </label>

        <label class="flex flex-col gap-1 text-xs">
            <span class="text-vscode-description uppercase"
                >docker-compose.yml</span
            >
            <textarea
                bind:value={compose}
                rows="10"
                placeholder="services:&#10;  web:&#10;    image: nginx&#10;    ports:&#10;      - 80:80"
                class="{inputCls} font-mono text-[12px]"
            ></textarea>
        </label>

        <div>
            <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] uppercase text-vscode-description"
                    >Environment variables</span
                >
                <Button size="sm" variant="ghost" onclick={addEnv}>+ Add</Button>
            </div>
            {#if envPairs.length === 0}
                <div class="text-[11px] text-vscode-description">
                    None — click "+ Add" to set environment variables.
                </div>
            {:else}
                <div class="space-y-2">
                    {#each envPairs as pair, i (i)}
                        <div class="flex items-center gap-2">
                            <input
                                type="text"
                                bind:value={pair.key}
                                placeholder="KEY"
                                class="{inputCls} font-mono text-xs w-1/3"
                            />
                            <input
                                type="text"
                                bind:value={pair.value}
                                placeholder="value"
                                class="{inputCls} font-mono text-xs flex-1"
                            />
                            <Button
                                size="sm"
                                variant="ghost"
                                onclick={() => removeEnv(i)}>×</Button
                            >
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>

    {#snippet footer()}
        <Button variant="ghost" onclick={onclose}>Cancel</Button>
        <Button
            variant="primary"
            disabled={!canSubmit}
            loading={submitting}
            onclick={submit}>Create project</Button
        >
    {/snippet}
</Modal>
