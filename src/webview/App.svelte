<script lang="ts">
    import { onMount } from "svelte";
    import Router, { link, router, replace } from "svelte-spa-router";
    import { routes } from "./routes";
    import { host } from "./lib/host";
    import Toast from "./lib/ui/Toast.svelte";

    const tabs = [
        { path: "/", label: "Overview" },
        { path: "/docker", label: "Docker" },
        { path: "/deploy", label: "Deploy" },
        { path: "/firewall", label: "Firewall" },
        { path: "/snapshots", label: "Snapshots" },
        { path: "/settings", label: "Settings" },
    ];

    let authChecked = $state(false);
    let hasToken = $state(false);

    onMount(() => {
        let cancelled = false;

        void (async () => {
            try {
                const result = await host().request("hasToken");
                if (!cancelled) {
                    hasToken = result;
                }
            } catch {
                if (!cancelled) {
                    hasToken = false;
                }
            } finally {
                if (!cancelled) {
                    authChecked = true;
                }
            }
        })();

        const offToken = host().on("tokenChanged", (payload) => {
            hasToken = payload.hasToken;
            if (!payload.hasToken && router.location !== "/onboarding") {
                replace("/onboarding");
            } else if (payload.hasToken && router.location === "/onboarding") {
                replace("/");
            }
        });

        const offNav = host().on("navigate", ({ path }) => {
            replace(path);
        });

        return () => {
            cancelled = true;
            offToken();
            offNav();
        };
    });

    $effect(() => {
        if (!authChecked) {
            return;
        }
        if (!hasToken && router.location !== "/onboarding") {
            replace("/onboarding");
        }
    });

    const showTabs = $derived(
        authChecked && hasToken && router.location !== "/onboarding",
    );
</script>

<div class="flex flex-col h-full text-vscode-fg bg-vscode-bg">
    {#if showTabs}
        <header
            class="flex items-center gap-4 border-b border-vscode-border px-4 h-9"
        >
            <span
                class="text-xs font-semibold tracking-wide uppercase text-vscode-description"
            >
                Hostinger
            </span>
            <div class="flex flex-1 items-center gap-1" role="tablist">
                {#each tabs as tab (tab.path)}
                    <a
                        use:link
                        href={tab.path}
                        role="tab"
                        aria-selected={router.location === tab.path}
                        class="px-3 py-1.5 text-xs rounded {router.location ===
                        tab.path
                            ? 'bg-vscode-list-active-bg text-vscode-list-active-fg'
                            : 'hover:bg-vscode-list-hover'}"
                    >
                        {tab.label}
                    </a>
                {/each}
            </div>
            <div data-slot="vps-selector"></div>
        </header>
    {/if}

    <main class="flex-1 overflow-y-auto">
        <div role="tabpanel" class="h-full">
            {#if authChecked}
                <Router {routes} />
            {:else}
                <div
                    class="flex items-center justify-center h-full text-vscode-description"
                >
                    Loading…
                </div>
            {/if}
        </div>
    </main>

    <Toast />
</div>
