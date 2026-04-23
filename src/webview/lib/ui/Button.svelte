<script lang="ts">
    import type { Snippet } from "svelte";

    type Variant = "primary" | "secondary" | "ghost" | "danger";
    type Size = "sm" | "md";

    interface Props {
        variant?: Variant;
        size?: Size;
        loading?: boolean;
        disabled?: boolean;
        type?: "button" | "submit" | "reset";
        onclick?: (e: MouseEvent) => void;
        ariaLabel?: string;
        children?: Snippet;
    }

    let {
        variant = "primary",
        size = "md",
        loading = false,
        disabled = false,
        type = "button",
        onclick,
        ariaLabel,
        children,
    }: Props = $props();

    const variantClass = $derived(
        variant === "primary"
            ? "bg-vscode-button-bg text-vscode-button-fg hover:bg-vscode-button-hover"
            : variant === "secondary"
              ? "bg-vscode-button-secondary-bg text-vscode-button-secondary-fg hover:bg-vscode-button-secondary-hover"
              : variant === "danger"
                ? "bg-vscode-error text-white hover:opacity-90"
                : "bg-transparent text-vscode-fg hover:bg-vscode-list-hover",
    );

    const sizeClass = $derived(
        size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
    );
</script>

<button
    {type}
    class="inline-flex items-center justify-center gap-1.5 rounded font-medium outline-none focus-visible:ring-2 focus-visible:ring-vscode-focus disabled:opacity-50 disabled:cursor-not-allowed transition-colors {variantClass} {sizeClass}"
    disabled={disabled || loading}
    aria-label={ariaLabel}
    {onclick}
>
    {#if loading}
        <span
            class="inline-block w-3 h-3 border-2 border-current border-r-transparent rounded-full animate-spin"
            aria-hidden="true"
        ></span>
    {/if}
    {@render children?.()}
</button>
