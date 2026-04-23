<script lang="ts">
    interface Props {
        data: number[];
        width?: number;
        height?: number;
        tone?: "neutral" | "warning";
    }

    let { data, width = 120, height = 32, tone = "neutral" }: Props = $props();

    const points = $derived.by(() => {
        if (data.length === 0) {return "";}
        if (data.length === 1) {
            const y = height / 2;
            return `0,${y} ${width},${y}`;
        }
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const stepX = width / (data.length - 1);
        return data
            .map((v, i) => {
                const x = (i * stepX).toFixed(2);
                const y = (height - ((v - min) / range) * height).toFixed(2);
                return `${x},${y}`;
            })
            .join(" ");
    });

    const areaPoints = $derived(
        points ? `0,${height} ${points} ${width},${height}` : "",
    );

    const stroke = $derived(
        tone === "warning"
            ? "var(--color-vscode-warning)"
            : "var(--color-vscode-fg)",
    );
</script>

<svg
    {width}
    {height}
    viewBox="0 0 {width} {height}"
    preserveAspectRatio="none"
    aria-hidden="true"
    class="overflow-visible"
>
    {#if data.length > 0}
        <polygon points={areaPoints} fill={stroke} fill-opacity="0.12" />
        <polyline
            points={points}
            fill="none"
            stroke={stroke}
            stroke-width="1.5"
            stroke-linejoin="round"
            stroke-linecap="round"
        />
    {/if}
</svg>
