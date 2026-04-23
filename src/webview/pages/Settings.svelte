<script lang="ts">
    import ConnectionPanel from "./Settings/ConnectionPanel.svelte";
    import VpsListPanel from "./Settings/VpsList.svelte";
    import DangerZone from "./Settings/DangerZone.svelte";

    const sections = [
        { id: "connection", label: "Connection" },
        { id: "vps", label: "VPS Instances" },
        { id: "polling", label: "Polling & Status Bar" },
        { id: "thresholds", label: "Thresholds" },
        { id: "deploy", label: "Deploy Defaults" },
        { id: "ssh", label: "SSH Keys" },
        { id: "danger", label: "Danger Zone" },
    ];
</script>

<div class="grid grid-cols-[180px_1fr] gap-6 p-4">
    <aside class="self-start sticky top-4">
        <nav aria-label="Settings sections">
            <ul class="text-xs space-y-1">
                {#each sections as s (s.id)}
                    <li>
                        <a
                            href={`#${s.id}`}
                            class="block px-2 py-1 rounded hover:bg-vscode-list-hover text-vscode-description hover:text-vscode-fg"
                        >
                            {s.label}
                        </a>
                    </li>
                {/each}
            </ul>
        </nav>
    </aside>

    <main class="space-y-6 min-w-0">
        <section id="connection" class="scroll-mt-4">
            <h2 class="text-lg font-semibold mb-2">Connection</h2>
            <ConnectionPanel />
        </section>

        <section id="vps" class="scroll-mt-4">
            <h2 class="text-lg font-semibold mb-2">VPS Instances</h2>
            <VpsListPanel />
        </section>

        <section id="polling" class="scroll-mt-4">
            <h2 class="text-lg font-semibold mb-2">Polling & Status Bar</h2>
            <p class="text-xs text-vscode-description">
                Configure metric refresh rate and the status bar chip. Coming
                in Milestone B.
            </p>
        </section>

        <section id="thresholds" class="scroll-mt-4">
            <h2 class="text-lg font-semibold mb-2">Thresholds</h2>
            <p class="text-xs text-vscode-description">
                CPU, RAM, and disk alert thresholds. Coming in Milestone B.
            </p>
        </section>

        <section id="deploy" class="scroll-mt-4">
            <h2 class="text-lg font-semibold mb-2">Deploy Defaults</h2>
            <p class="text-xs text-vscode-description">
                Pre-deploy snapshot, post-deploy action, default domain.
                Coming in Milestone B.
            </p>
        </section>

        <section id="ssh" class="scroll-mt-4">
            <h2 class="text-lg font-semibold mb-2">SSH Keys</h2>
            <p class="text-xs text-vscode-description">
                Manage account SSH keys and register local keys. Coming in
                Milestone B.
            </p>
        </section>

        <section id="danger" class="scroll-mt-4">
            <h2 class="text-lg font-semibold mb-2">Danger Zone</h2>
            <DangerZone />
        </section>
    </main>
</div>
