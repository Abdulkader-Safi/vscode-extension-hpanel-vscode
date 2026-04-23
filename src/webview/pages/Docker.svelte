<script lang="ts">
    import { onMount } from "svelte";
    import Button from "../lib/ui/Button.svelte";
    import Card from "../lib/ui/Card.svelte";
    import EmptyState from "../lib/ui/EmptyState.svelte";
    import Skeleton from "../lib/ui/Skeleton.svelte";
    import ProjectSummary from "./Docker/ProjectSummary.svelte";
    import ProjectList from "./Docker/ProjectList.svelte";
    import LogViewer from "./Docker/LogViewer.svelte";
    import NewProjectModal from "./Docker/NewProjectModal.svelte";
    import { host } from "../lib/host";
    import { toasts } from "../lib/ui/toastStore";
    import type { Vps, DockerProject } from "../../api/types";

    let vps = $state<Vps | null | undefined>(undefined);
    let projects = $state<DockerProject[] | null>(null);
    let projectsError = $state<string | null>(null);
    let filter = $state("");
    let logsProject = $state<string | null>(null);
    let modalOpen = $state(false);

    // Hostinger returns "[VPS:2044] Currently installed operating system
    // does not support Docker Manager." for VPSes that don't have the
    // Docker Manager OS template — this is *not* a bug, the API only
    // exposes Compose projects deployed via that template.
    const unsupportedOs = $derived(
        projectsError !== null &&
            (projectsError.includes("VPS:2044") ||
                projectsError
                    .toLowerCase()
                    .includes("does not support docker manager")),
    );

    async function loadVps(): Promise<void> {
        try {
            vps = await host().request("getActiveVps");
        } catch (err) {
            vps = null;
            toasts.error(
                err instanceof Error ? err.message : "Could not load VPS",
            );
        }
    }

    async function loadProjects(): Promise<void> {
        if (!vps) {return;}
        const id = vps.id;
        try {
            projects = await host().request("listDockerProjects", { vpsId: id });
            projectsError = null;
        } catch (err) {
            projectsError =
                err instanceof Error ? err.message : "Could not load projects";
            projects = [];
        }
    }

    onMount(() => {
        let cancelled = false;
        void (async () => {
            await loadVps();
            if (!cancelled && vps) {
                await loadProjects();
            }
        })();

        const off = host().on("preferenceChanged", ({ key }) => {
            if (key === "activeVpsId") {
                logsProject = null;
                projects = null;
                void (async () => {
                    await loadVps();
                    if (vps) {await loadProjects();}
                })();
            }
        });

        return () => {
            cancelled = true;
            off();
        };
    });
</script>

{#if vps === undefined}
    <div class="p-4 space-y-3">
        <Skeleton height="80px" />
        <Skeleton height="200px" />
    </div>
{:else if vps === null}
    <div class="p-4">
        <EmptyState
            heading="No VPS selected"
            description="Pick a VPS from the top-nav selector."
        />
    </div>
{:else}
    <div class="p-4 space-y-4">
        <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold">Docker projects</h2>
            {#if !unsupportedOs}
                <Button variant="primary" onclick={() => (modalOpen = true)}>
                    + New project
                </Button>
            {/if}
        </div>

        {#if unsupportedOs}
            <Card>
                <div class="space-y-2">
                    <div
                        class="text-sm font-medium text-vscode-warning"
                    >
                        Docker Manager isn't installed on this VPS
                    </div>
                    <p class="text-xs text-vscode-description">
                        Hostinger's API only manages Compose projects that were
                        deployed via the <span class="font-medium"
                            >Docker Manager</span
                        >
                        OS template. Your VPS is running a different template
                        (likely a plain Ubuntu / Debian image), so the API
                        refuses to list or create projects here.
                    </p>
                    <p class="text-xs text-vscode-description">
                        Two options:
                    </p>
                    <ul
                        class="text-xs text-vscode-description list-disc pl-5 space-y-1"
                    >
                        <li>
                            Manage your existing Docker setup over SSH (use the
                            <span class="font-mono">Quick SSH</span> card on the
                            Overview tab).
                        </li>
                        <li>
                            Reinstall this VPS with the <span
                                class="font-medium">Docker Manager</span
                            >
                            template in hPanel to enable this tab. (Destructive
                            — back up first.)
                        </li>
                    </ul>
                </div>
            </Card>
        {:else}
            <ProjectSummary
                {projects}
                {filter}
                onfilter={(v) => (filter = v)}
            />

            <ProjectList
                vpsId={vps.id}
                {projects}
                error={projectsError}
                {filter}
                {logsProject}
                onaction={loadProjects}
                onshowlogs={(p) =>
                    (logsProject = logsProject === p ? null : p)}
            />

            {#if logsProject}
                <LogViewer
                    vpsId={vps.id}
                    project={logsProject}
                    onclose={() => (logsProject = null)}
                />
            {/if}

            <NewProjectModal
                open={modalOpen}
                vpsId={vps.id}
                onclose={() => (modalOpen = false)}
                oncreated={loadProjects}
            />
        {/if}
    </div>
{/if}
