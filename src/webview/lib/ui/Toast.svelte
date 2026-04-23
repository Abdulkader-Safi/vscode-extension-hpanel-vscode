<script lang="ts">
    import { toasts, type ToastTone } from "./toastStore";

    function toneCls(tone: ToastTone): string {
        if (tone === "success")
            {return "border-vscode-success bg-vscode-success/10";}
        if (tone === "error") {return "border-vscode-error bg-vscode-error/10";}
        if (tone === "warning")
            {return "border-vscode-warning bg-vscode-warning/10";}
        return "border-vscode-info bg-vscode-info/10";
    }
</script>

<div
    class="fixed bottom-3 right-3 flex flex-col gap-2 z-50 max-w-sm"
    aria-live="polite"
    role="region"
    aria-label="Notifications"
>
    {#each $toasts as toast (toast.id)}
        <div
            class="border-l-4 px-3 py-2 rounded shadow-md text-sm bg-vscode-code-bg flex items-start gap-2 {toneCls(
                toast.tone,
            )}"
            role={toast.tone === "error" ? "alert" : "status"}
        >
            <span class="flex-1">{toast.message}</span>
            <button
                type="button"
                class="text-vscode-description hover:text-vscode-fg"
                aria-label="Dismiss notification"
                onclick={() => toasts.dismiss(toast.id)}
            >
                ×
            </button>
        </div>
    {/each}
</div>
