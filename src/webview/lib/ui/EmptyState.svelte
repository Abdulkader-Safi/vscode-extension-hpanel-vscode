<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        heading: string;
        description?: string;
        icon?: Snippet;
        cta?: Snippet;
    }

    let { heading, description, icon, cta }: Props = $props();
</script>

<div
    class="flex flex-col items-center justify-center py-12 px-4 text-center text-vscode-description"
>
    {#if icon}
        <div class="mb-3 opacity-60 text-2xl">{@render icon()}</div>
    {/if}
    <h3 class="text-sm font-semibold text-vscode-fg mb-1">{heading}</h3>
    {#if description}
        <p class="text-xs mb-4 max-w-sm">{description}</p>
    {/if}
    {#if cta}
        <div>{@render cta()}</div>
    {/if}
</div>
