<script lang="ts">
    import Card from "../../lib/ui/Card.svelte";
    import Skeleton from "../../lib/ui/Skeleton.svelte";
    import EmptyState from "../../lib/ui/EmptyState.svelte";
    import ProjectRow from "./ProjectRow.svelte";
    import type { DockerProject } from "../../../api/types";

    interface Props {
        vpsId: number;
        projects: DockerProject[] | null;
        error: string | null;
        filter: string;
        logsProject: string | null;
        onaction: () => void;
        onshowlogs: (project: string) => void;
    }

    let {
        vpsId,
        projects,
        error,
        filter,
        logsProject,
        onaction,
        onshowlogs,
    }: Props = $props();

    const filtered = $derived.by(() => {
        if (!projects) {return null;}
        const q = filter.trim().toLowerCase();
        if (!q) {return projects;}
        return projects.filter((p) => p.name.toLowerCase().includes(q));
    });
</script>

<Card padded={false}>
    {#if error}
        <div
            class="text-xs text-vscode-error bg-vscode-error/10 border-b border-vscode-error/40 px-3 py-2"
            role="alert"
        >
            Couldn't load projects: {error}
        </div>
    {/if}

    {#if projects === null}
        <div class="p-3 space-y-2">
            <Skeleton height="24px" />
            <Skeleton height="24px" />
            <Skeleton height="24px" />
        </div>
    {:else if filtered === null || filtered.length === 0}
        {#if projects.length === 0}
            <EmptyState
                heading="No Docker projects"
                description="Click 'New project' to deploy your first Compose stack."
            />
        {:else}
            <EmptyState
                heading="No matches"
                description="No projects match the current filter."
            />
        {/if}
    {:else}
        <div>
            {#each filtered as p (p.name)}
                <ProjectRow
                    {vpsId}
                    project={p}
                    logsOpen={logsProject === p.name}
                    {onaction}
                    onshowlogs={() => onshowlogs(p.name)}
                />
            {/each}
        </div>
    {/if}
</Card>
