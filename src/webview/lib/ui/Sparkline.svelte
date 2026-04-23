<script lang="ts">
    interface Props {
        data: number[];
        timestamps?: number[];
        width?: number;
        height?: number;
        tone?: "neutral" | "warning";
        formatValue?: (v: number) => string;
    }

    let {
        data,
        timestamps,
        width = 120,
        height = 32,
        tone = "neutral",
        formatValue = (v: number): string => v.toFixed(2),
    }: Props = $props();

    let containerEl: HTMLDivElement | undefined = $state();
    let hoverIdx = $state<number | null>(null);
    let tooltipPxX = $state(0);

    const min = $derived(data.length === 0 ? 0 : Math.min(...data));
    const max = $derived(data.length === 0 ? 1 : Math.max(...data));
    const range = $derived(max - min || 1);
    const stepX = $derived(data.length > 1 ? width / (data.length - 1) : 0);

    const points = $derived.by(() => {
        if (data.length === 0) {
            return "";
        }
        if (data.length === 1) {
            const y = height / 2;
            return `0,${y} ${width},${y}`;
        }
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

    function markerVbX(idx: number): number {
        return idx * stepX;
    }

    function markerVbY(idx: number): number {
        return height - ((data[idx] - min) / range) * height;
    }

    function onMouseMove(e: MouseEvent): void {
        if (data.length === 0 || !containerEl) {
            return;
        }
        const rect = containerEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, x / rect.width));
        const idx = Math.round(ratio * (data.length - 1));
        hoverIdx = idx;
        tooltipPxX = (idx / Math.max(1, data.length - 1)) * rect.width;
    }

    function onMouseLeave(): void {
        hoverIdx = null;
    }

    function formatTimestamp(ts: number | undefined): string {
        if (ts === undefined) {
            return "";
        }
        const d = new Date(ts * 1000);
        if (Number.isNaN(d.getTime())) {
            return "";
        }
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mi = String(d.getMinutes()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
    }
</script>

<div
    bind:this={containerEl}
    class="relative inline-block"
    style:width="{width}px"
    style:height="{height}px"
    onmousemove={onMouseMove}
    onmouseleave={onMouseLeave}
    role="presentation"
>
    <svg
        {width}
        {height}
        viewBox="0 0 {width} {height}"
        preserveAspectRatio="none"
        aria-hidden="true"
        class="overflow-visible block"
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
            {#if hoverIdx !== null && data[hoverIdx] !== undefined}
                <circle
                    cx={markerVbX(hoverIdx)}
                    cy={markerVbY(hoverIdx)}
                    r="3"
                    fill={stroke}
                    stroke="var(--color-vscode-bg)"
                    stroke-width="1.5"
                />
            {/if}
        {/if}
    </svg>

    {#if hoverIdx !== null && data[hoverIdx] !== undefined}
        <div
            class="absolute pointer-events-none z-10 bg-vscode-bg border border-vscode-border rounded px-2 py-1 text-xs shadow-lg whitespace-nowrap text-center"
            style:left="{tooltipPxX}px"
            style:top="-48px"
            style:transform="translateX(-50%)"
        >
            {#if timestamps && timestamps[hoverIdx] !== undefined}
                <div class="text-[10px] text-vscode-description">
                    {formatTimestamp(timestamps[hoverIdx])}
                </div>
            {/if}
            <div class="font-mono font-semibold">
                {formatValue(data[hoverIdx])}
            </div>
        </div>
    {/if}
</div>
