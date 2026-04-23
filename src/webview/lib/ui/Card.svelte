<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        padded?: boolean;
        children?: Snippet;
    }

    let { padded = true, children }: Props = $props();
</script>

<div
    class="bg-vscode-code-bg border border-vscode-border rounded {padded
        ? 'p-4'
        : ''}"
>
    {@render children?.()}
</div>
