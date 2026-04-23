<script lang="ts">
    import ConfirmInline from "../../lib/ui/ConfirmInline.svelte";
    import { host } from "../../lib/host";
    import { toasts } from "../../lib/ui/toastStore";

    async function disconnect(): Promise<void> {
        try {
            await host().request("disconnect");
            // The host emits tokenChanged → App.svelte routes to /onboarding.
        } catch (err) {
            toasts.error(
                err instanceof Error ? err.message : "Disconnect failed",
            );
        }
    }

    async function resetSettings(): Promise<void> {
        try {
            await host().request("resetPreferences");
            toasts.success("Settings reset to defaults");
        } catch (err) {
            toasts.error(err instanceof Error ? err.message : "Reset failed");
        }
    }
</script>

<div
    class="rounded border border-vscode-error/40 bg-vscode-error/5 p-4 space-y-3"
>
    <p class="text-xs text-vscode-description">
        Irreversible actions. Confirmation required.
    </p>
    <div class="flex items-center justify-between gap-3">
        <div>
            <div class="text-sm font-medium">Disconnect account</div>
            <div class="text-xs text-vscode-description">
                Clears the stored API token and returns you to onboarding.
            </div>
        </div>
        <ConfirmInline
            label="Disconnect"
            variant="danger"
            onconfirm={disconnect}
        />
    </div>
    <div class="flex items-center justify-between gap-3">
        <div>
            <div class="text-sm font-medium">Reset all settings</div>
            <div class="text-xs text-vscode-description">
                Restores default preferences. Your API token stays connected.
            </div>
        </div>
        <ConfirmInline
            label="Reset"
            variant="danger"
            onconfirm={resetSettings}
        />
    </div>
</div>
