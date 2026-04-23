<script lang="ts">
    import Card from "../../lib/ui/Card.svelte";
    import type { DockerProject } from "../../../api/types";

    interface Props {
        projects: DockerProject[] | null;
        filter: string;
        onfilter: (value: string) => void;
    }

    let { projects, filter, onfilter }: Props = $props();

    const projectCount = $derived(projects?.length ?? 0);
    const containerCount = $derived(
        projects?.reduce((n, p) => n + (p.container_count ?? 0), 0) ?? 0,
    );
    const unhealthyCount = $derived(
        projects?.filter((p) => p.status === "partial" || p.status === "unknown")
            .length ?? 0,
    );
</script>

<Card>
    <div class="flex items-center gap-6 flex-wrap">
        <div>
            <div class="text-[10px] uppercase text-vscode-description">
                Projects
            </div>
            <div class="text-lg font-semibold">{projectCount}</div>
        </div>
        <div>
            <div class="text-[10px] uppercase text-vscode-description">
                Containers
            </div>
            <div class="text-lg font-semibold">{containerCount}</div>
        </div>
        <div>
            <div class="text-[10px] uppercase text-vscode-description">
                Unhealthy
            </div>
            <div
                class="text-lg font-semibold {unhealthyCount > 0
                    ? 'text-vscode-warning'
                    : ''}"
            >
                {unhealthyCount}
            </div>
        </div>
        <div class="flex-1 min-w-[200px]">
            <label class="flex flex-col text-xs">
                <span class="text-[10px] uppercase text-vscode-description"
                    >Filter</span
                >
                <input
                    type="text"
                    value={filter}
                    oninput={(e) => onfilter((e.target as HTMLInputElement).value)}
                    placeholder="Search by name…"
                    class="mt-1 px-2 py-1 text-sm bg-vscode-input-bg text-vscode-input-fg border border-vscode-input-border rounded focus:outline-none focus:ring-1 focus:ring-vscode-focus"
                />
            </label>
        </div>
    </div>
</Card>
