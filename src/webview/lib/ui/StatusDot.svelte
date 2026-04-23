<script lang="ts">
    type State = "running" | "stopped" | "error" | "unknown" | "pending";

    interface Props {
        state: State;
        label?: string;
    }

    let { state, label }: Props = $props();

    const cls = $derived(
        state === "running"
            ? "bg-vscode-success"
            : state === "stopped"
              ? "bg-vscode-fg/30"
              : state === "error"
                ? "bg-vscode-error"
                : state === "pending"
                  ? "bg-vscode-warning animate-pulse motion-reduce:animate-none"
                  : "bg-vscode-fg/50",
    );

    const ariaLabel = $derived(label ?? `Status: ${state}`);
</script>

<span
    class="inline-block w-2 h-2 rounded-full {cls}"
    role="img"
    aria-label={ariaLabel}
></span>
