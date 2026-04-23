<script lang="ts">
    import Card from "../../lib/ui/Card.svelte";
    import Button from "../../lib/ui/Button.svelte";
    import { preferences } from "../../lib/preferences";
    import { host } from "../../lib/host";
    import { toasts } from "../../lib/ui/toastStore";
    import type { DeployPostAction } from "../../../state/Preferences";

    const stored = $derived($preferences?.deploy);

    let preSnapshot = $state(true);
    let postAction = $state<DeployPostAction>("none");
    let confirm = $state(true);
    let defaultDomain = $state("");

    $effect(() => {
        if (stored) {
            preSnapshot = stored.preSnapshot;
            postAction = stored.postAction;
            confirm = stored.confirm;
            defaultDomain = stored.defaultDomain ?? "";
        }
    });

    async function apply(): Promise<void> {
        try {
            await host().request("setDeployDefaults", {
                value: {
                    preSnapshot,
                    postAction,
                    confirm,
                    defaultDomain: defaultDomain.trim() || null,
                },
            });
            toasts.success("Deploy defaults saved");
        } catch (err) {
            toasts.error(err instanceof Error ? err.message : "Could not save");
        }
    }

    const inputCls =
        "px-2 py-1 text-sm bg-vscode-input-bg text-vscode-input-fg border border-vscode-input-border rounded focus:outline-none focus:ring-1 focus:ring-vscode-focus";
</script>

<Card>
    <div class="space-y-3">
        <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" bind:checked={preSnapshot} />
            Auto-snapshot before deploy
        </label>

        <label class="flex flex-col gap-1 text-xs max-w-md">
            <span class="text-vscode-description uppercase"
                >Post-deploy action</span
            >
            <select bind:value={postAction} class={inputCls}>
                <option value="none">None</option>
                <option value="restartDocker">Restart Docker project</option>
                <option value="openLog">Open deploy log</option>
            </select>
        </label>

        <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" bind:checked={confirm} />
            Require explicit confirmation before deploy
        </label>

        <label class="flex flex-col gap-1 text-xs max-w-md">
            <span class="text-vscode-description uppercase"
                >Default deploy domain</span
            >
            <input
                type="text"
                bind:value={defaultDomain}
                placeholder="example.com"
                class={inputCls}
            />
        </label>

        <Button size="sm" onclick={apply}>Apply defaults</Button>
    </div>
</Card>
