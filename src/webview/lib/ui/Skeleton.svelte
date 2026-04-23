<script lang="ts">
    interface Props {
        height?: string;
        width?: string;
        rounded?: boolean;
    }

    let { height = "1rem", width = "100%", rounded = false }: Props = $props();
</script>

<div
    class="animate-pulse bg-vscode-list-hover {rounded
        ? 'rounded-full'
        : 'rounded'} motion-reduce:animate-none"
    style:height
    style:width
    aria-hidden="true"
></div>
