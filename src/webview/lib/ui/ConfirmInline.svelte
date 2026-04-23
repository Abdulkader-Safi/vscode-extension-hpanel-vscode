<script lang="ts">
    import Button from "./Button.svelte";

    type Variant = "primary" | "secondary" | "ghost" | "danger";
    type Size = "sm" | "md";

    interface Props {
        label: string;
        confirmLabel?: string;
        onconfirm: () => void;
        variant?: Variant;
        size?: Size;
        disabled?: boolean;
        autoCancelMs?: number;
    }

    let {
        label,
        confirmLabel = "Are you sure?",
        onconfirm,
        variant = "danger",
        size = "md",
        disabled = false,
        autoCancelMs = 8000,
    }: Props = $props();

    let armed = $state(false);
    let timer: ReturnType<typeof setTimeout> | null = null;

    function disarm(): void {
        armed = false;
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    }

    function arm(): void {
        if (armed) {return;}
        armed = true;
        if (timer) {clearTimeout(timer);}
        timer = setTimeout(disarm, autoCancelMs);
    }

    function confirm(): void {
        onconfirm();
        disarm();
    }

    $effect(() => {
        return () => {
            if (timer) {clearTimeout(timer);}
        };
    });
</script>

{#if !armed}
    <Button {variant} {size} {disabled} onclick={arm}>{label}</Button>
{:else}
    <span class="inline-flex items-center gap-1.5">
        <span class="text-xs text-vscode-description">{confirmLabel}</span>
        <Button variant="danger" {size} onclick={confirm}>Yes</Button>
        <Button variant="ghost" {size} onclick={disarm}>Cancel</Button>
    </span>
{/if}
