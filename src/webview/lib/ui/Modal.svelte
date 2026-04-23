<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        open: boolean;
        title: string;
        onclose: () => void;
        children?: Snippet;
        footer?: Snippet;
    }

    let { open, title, onclose, children, footer }: Props = $props();

    let dialogEl: HTMLDivElement | undefined = $state();

    $effect(() => {
        if (!open || !dialogEl) {return;}
        const previousActive = document.activeElement as HTMLElement | null;
        const focusables = dialogEl.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        focusables[0]?.focus();

        const handleKey = (e: KeyboardEvent): void => {
            if (e.key === "Escape") {
                e.preventDefault();
                onclose();
            } else if (e.key === "Tab" && focusables.length > 0) {
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("keydown", handleKey);
            previousActive?.focus();
        };
    });
</script>

{#if open}
    <button
        type="button"
        class="fixed inset-0 z-40 bg-black/50 cursor-default"
        aria-label="Close dialog"
        onclick={onclose}
    ></button>
    <div
        class="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none"
    >
        <div
            bind:this={dialogEl}
            class="bg-vscode-bg border border-vscode-border rounded shadow-xl max-w-lg w-full max-h-[80vh] overflow-auto pointer-events-auto"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <header
                class="flex items-center justify-between border-b border-vscode-border px-4 py-2"
            >
                <h2 class="text-sm font-semibold">{title}</h2>
                <button
                    type="button"
                    class="text-vscode-description hover:text-vscode-fg"
                    aria-label="Close"
                    onclick={onclose}
                >
                    ×
                </button>
            </header>
            <div class="p-4">
                {@render children?.()}
            </div>
            {#if footer}
                <footer
                    class="border-t border-vscode-border px-4 py-2 flex justify-end gap-2"
                >
                    {@render footer()}
                </footer>
            {/if}
        </div>
    </div>
{/if}
