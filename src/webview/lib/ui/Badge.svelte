<script lang="ts">
    import type { Snippet } from "svelte";

    type Tone = "neutral" | "success" | "warning" | "error" | "info";

    interface Props {
        tone?: Tone;
        children?: Snippet;
    }

    let { tone = "neutral", children }: Props = $props();

    const cls = $derived(
        tone === "success"
            ? "bg-vscode-success/20 text-vscode-success"
            : tone === "warning"
              ? "bg-vscode-warning/20 text-vscode-warning"
              : tone === "error"
                ? "bg-vscode-error/20 text-vscode-error"
                : tone === "info"
                  ? "bg-vscode-info/20 text-vscode-info"
                  : "bg-vscode-badge-bg text-vscode-badge-fg",
    );
</script>

<span
    class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium {cls}"
>
    {@render children?.()}
</span>
