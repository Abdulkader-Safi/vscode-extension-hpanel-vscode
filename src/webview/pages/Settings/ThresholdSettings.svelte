<script lang="ts">
    import Card from "../../lib/ui/Card.svelte";
    import Button from "../../lib/ui/Button.svelte";
    import { preferences } from "../../lib/preferences";
    import { host } from "../../lib/host";
    import { toasts } from "../../lib/ui/toastStore";
    import { clampThreshold } from "../../lib/clamp";

    const stored = $derived(
        $preferences?.thresholds ?? { cpu: 85, ram: 90, disk: 80 },
    );
    const notif = $derived($preferences?.notificationsOnThreshold ?? true);

    let cpu = $state(85);
    let ram = $state(90);
    let disk = $state(80);
    let snoozed = $state(false);

    // Sync local inputs when preferences change externally.
    $effect(() => {
        cpu = stored.cpu;
        ram = stored.ram;
        disk = stored.disk;
    });

    async function apply(): Promise<void> {
        const value = {
            cpu: clampThreshold(cpu),
            ram: clampThreshold(ram),
            disk: clampThreshold(disk),
        };
        try {
            await host().request("setThresholds", { value });
            toasts.success("Thresholds saved");
        } catch (err) {
            toasts.error(err instanceof Error ? err.message : "Could not save");
        }
    }

    async function toggleNotif(e: Event): Promise<void> {
        const value = (e.target as HTMLInputElement).checked;
        try {
            await host().request("setNotificationsOnThreshold", { value });
        } catch (err) {
            toasts.error(
                err instanceof Error ? err.message : "Could not toggle",
            );
        }
    }

    async function toggleSnooze(e: Event): Promise<void> {
        snoozed = (e.target as HTMLInputElement).checked;
        try {
            await host().request("setSnoozeStatusBar", { value: snoozed });
        } catch (err) {
            toasts.error(
                err instanceof Error ? err.message : "Could not snooze",
            );
        }
    }

    const inputCls =
        "w-20 px-2 py-1 text-sm bg-vscode-input-bg text-vscode-input-fg border border-vscode-input-border rounded focus:outline-none focus:ring-1 focus:ring-vscode-focus";
</script>

<Card>
    <div class="space-y-3">
        <div class="grid grid-cols-3 gap-3 max-w-md">
            <label class="flex flex-col gap-1 text-xs">
                <span class="text-vscode-description uppercase">CPU %</span>
                <input
                    type="number"
                    min="1"
                    max="99"
                    bind:value={cpu}
                    class={inputCls}
                />
            </label>
            <label class="flex flex-col gap-1 text-xs">
                <span class="text-vscode-description uppercase">RAM %</span>
                <input
                    type="number"
                    min="1"
                    max="99"
                    bind:value={ram}
                    class={inputCls}
                />
            </label>
            <label class="flex flex-col gap-1 text-xs">
                <span class="text-vscode-description uppercase">Disk %</span>
                <input
                    type="number"
                    min="1"
                    max="99"
                    bind:value={disk}
                    class={inputCls}
                />
            </label>
        </div>

        <Button size="sm" onclick={apply}>Apply thresholds</Button>

        <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={notif} onchange={toggleNotif} />
            Show VS Code notification on threshold breach
        </label>

        <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={snoozed} onchange={toggleSnooze} />
            Snooze warning highlight for this session
        </label>
    </div>
</Card>
