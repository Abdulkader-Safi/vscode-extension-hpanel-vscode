<script lang="ts">
    import { onMount } from "svelte";
    import StatusDot from "./StatusDot.svelte";
    import { vpsList, refresh as refreshVpsList } from "../vpsList";
    import { preferences } from "../preferences";
    import { host } from "../host";
    import type { Vps, VpsState } from "../../../api/types";

    let open = $state(false);
    let buttonEl: HTMLButtonElement | undefined = $state();
    let menuEl: HTMLDivElement | undefined = $state();
    let highlightIdx = $state(0);

    const list = $derived($vpsList);
    const activeId = $derived($preferences?.activeVpsId ?? null);
    const active = $derived(
        list?.find((v) => v.id === activeId) ?? list?.[0] ?? null,
    );

    onMount(() => {
        void refreshVpsList();
        function onClickOutside(e: MouseEvent): void {
            if (!open) {
                return;
            }
            const t = e.target as Node;
            if (
                menuEl &&
                !menuEl.contains(t) &&
                buttonEl &&
                !buttonEl.contains(t)
            ) {
                open = false;
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        const offPref = host().on("preferenceChanged", ({ key }) => {
            if (key === "activeVpsId") {
                void refreshVpsList();
            }
        });
        return () => {
            document.removeEventListener("mousedown", onClickOutside);
            offPref();
        };
    });

    function mapState(
        s: VpsState,
    ): "running" | "stopped" | "error" | "unknown" {
        if (s === "running") {
            return "running";
        }
        if (s === "stopped") {
            return "stopped";
        }
        return "unknown";
    }

    async function selectVps(v: Vps): Promise<void> {
        await host().request("setActiveVpsId", { id: v.id });
        open = false;
        buttonEl?.focus();
    }

    function openMenu(): void {
        if (!list) {
            return;
        }
        open = true;
        const i = list.findIndex((v) => v.id === activeId);
        highlightIdx = i >= 0 ? i : 0;
    }

    function onButtonKeydown(e: KeyboardEvent): void {
        if (open) {
            return;
        }
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            openMenu();
        }
    }

    function onMenuKeydown(e: KeyboardEvent): void {
        if (!list) {
            return;
        }
        if (e.key === "Escape") {
            e.preventDefault();
            open = false;
            buttonEl?.focus();
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            highlightIdx = (highlightIdx + 1) % list.length;
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            highlightIdx = (highlightIdx - 1 + list.length) % list.length;
        } else if (e.key === "Enter" && list[highlightIdx]) {
            e.preventDefault();
            void selectVps(list[highlightIdx]);
        }
    }
</script>

<div class="relative inline-block">
    {#if list === null}
        <span class="text-xs text-vscode-description">Loading…</span>
    {:else if list.length === 0}
        <span class="text-xs text-vscode-description">No VPS</span>
    {:else if active}
        <button
            bind:this={buttonEl}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            onclick={() => (open ? (open = false) : openMenu())}
            onkeydown={onButtonKeydown}
            class="inline-flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-vscode-list-hover focus:outline-none focus:ring-1 focus:ring-vscode-focus"
        >
            <StatusDot state={mapState(active.state)} label={active.state} />
            <span class="font-medium truncate max-w-[160px]"
                >{active.hostname}</span
            >
            <span aria-hidden="true" class="text-vscode-description">▾</span>
        </button>

        {#if open}
            <div
                bind:this={menuEl}
                role="listbox"
                tabindex="-1"
                onkeydown={onMenuKeydown}
                aria-label="Select VPS"
                class="absolute right-0 mt-1 min-w-[240px] bg-vscode-bg border border-vscode-border rounded shadow-xl z-50 py-1"
            >
                {#each list as v, i (v.id)}
                    <button
                        type="button"
                        role="option"
                        aria-selected={v.id === activeId}
                        class="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-vscode-list-hover {i ===
                        highlightIdx
                            ? 'bg-vscode-list-hover'
                            : ''}"
                        onclick={() => selectVps(v)}
                        onmouseenter={() => (highlightIdx = i)}
                    >
                        <StatusDot
                            state={mapState(v.state)}
                            label={v.state}
                        />
                        <span class="font-medium truncate flex-1"
                            >{v.hostname}</span
                        >
                        <span
                            class="font-mono text-[10px] text-vscode-description"
                            >{v.ipv4?.[0]?.address ?? ""}</span
                        >
                        {#if v.id === activeId}
                            <span
                                class="text-[9px] font-semibold uppercase text-vscode-link"
                                >Default</span
                            >
                        {/if}
                    </button>
                {/each}
            </div>
        {/if}
    {/if}
</div>
