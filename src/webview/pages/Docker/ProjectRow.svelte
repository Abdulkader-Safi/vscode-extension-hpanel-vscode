<script lang="ts">
    import Button from "../../lib/ui/Button.svelte";
    import Badge from "../../lib/ui/Badge.svelte";
    import Skeleton from "../../lib/ui/Skeleton.svelte";
    import ConfirmInline from "../../lib/ui/ConfirmInline.svelte";
    import { host } from "../../lib/host";
    import { toasts } from "../../lib/ui/toastStore";
    import type {
        DockerProject,
        DockerContainer,
        DockerProjectStatus,
        DockerContainerStatus,
    } from "../../../api/types";

    interface Props {
        vpsId: number;
        project: DockerProject;
        logsOpen: boolean;
        onaction: () => void;
        onshowlogs: () => void;
    }

    let { vpsId, project, logsOpen, onaction, onshowlogs }: Props = $props();

    let expanded = $state(false);
    let containers = $state<DockerContainer[] | null>(null);
    let loadingContainers = $state(false);
    let actionBusy = $state<string | null>(null);

    function projectTone(
        s: DockerProjectStatus,
    ): "success" | "neutral" | "warning" | "error" {
        if (s === "running") {return "success";}
        if (s === "partial") {return "warning";}
        if (s === "stopped") {return "neutral";}
        return "neutral";
    }

    function containerTone(
        s: DockerContainerStatus,
    ): "success" | "neutral" | "warning" | "error" {
        if (s === "running") {return "success";}
        if (s === "restarting") {return "warning";}
        if (s === "exited") {return "error";}
        return "neutral";
    }

    async function toggleExpand(): Promise<void> {
        expanded = !expanded;
        if (expanded && containers === null) {
            loadingContainers = true;
            try {
                containers = await host().request("getDockerContainers", {
                    vpsId,
                    name: project.name,
                });
            } catch (err) {
                toasts.error(
                    err instanceof Error
                        ? err.message
                        : "Could not load containers",
                );
                containers = [];
            } finally {
                loadingContainers = false;
            }
        }
    }

    async function runAction(
        action: "start" | "stop" | "restart" | "update" | "delete",
    ): Promise<void> {
        actionBusy = action;
        try {
            await host().request("dockerAction", {
                vpsId,
                name: project.name,
                action,
            });
            toasts.success(`${action} on ${project.name} requested`);
            onaction();
        } catch (err) {
            toasts.error(
                err instanceof Error ? err.message : `${action} failed`,
            );
        } finally {
            actionBusy = null;
        }
    }
</script>

<div class="border-b border-vscode-border last:border-b-0 group">
    <div class="flex items-center gap-3 py-2 px-2 hover:bg-vscode-list-hover">
        <button
            type="button"
            class="text-vscode-description hover:text-vscode-fg text-xs w-4"
            aria-label={expanded ? "Collapse" : "Expand"}
            aria-expanded={expanded}
            onclick={toggleExpand}
        >
            {expanded ? "▾" : "▸"}
        </button>

        <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium truncate">{project.name}</span>
                <Badge tone={projectTone(project.status)}>{project.status}</Badge>
                <span class="text-[11px] text-vscode-description"
                    >{project.container_count ?? 0} containers</span
                >
            </div>
        </div>

        <div
            class="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity"
        >
            <Button
                size="sm"
                variant="ghost"
                loading={actionBusy === "start"}
                onclick={() => runAction("start")}>Start</Button
            >
            <Button
                size="sm"
                variant="ghost"
                loading={actionBusy === "stop"}
                onclick={() => runAction("stop")}>Stop</Button
            >
            <Button
                size="sm"
                variant="ghost"
                loading={actionBusy === "restart"}
                onclick={() => runAction("restart")}>Restart</Button
            >
            <Button
                size="sm"
                variant="ghost"
                loading={actionBusy === "update"}
                onclick={() => runAction("update")}>Update</Button
            >
            <Button
                size="sm"
                variant={logsOpen ? "primary" : "ghost"}
                onclick={onshowlogs}>Logs</Button
            >
            <ConfirmInline
                label="Delete"
                size="sm"
                variant="danger"
                onconfirm={() => runAction("delete")}
            />
        </div>
    </div>

    {#if expanded}
        <div class="px-6 py-2 bg-vscode-code-bg border-t border-vscode-border">
            {#if loadingContainers}
                <Skeleton height="20px" />
            {:else if !containers || containers.length === 0}
                <div class="text-xs text-vscode-description py-1">
                    No containers.
                </div>
            {:else}
                <ul class="text-xs divide-y divide-vscode-border">
                    {#each containers as c (c.id)}
                        <li
                            class="py-1.5 flex items-center gap-2 flex-wrap"
                        >
                            <Badge tone={containerTone(c.status)}>
                                {c.status}
                            </Badge>
                            <span class="font-medium">{c.name}</span>
                            <span
                                class="font-mono text-[10px] text-vscode-description"
                                >{c.image}</span
                            >
                            {#if c.ports && c.ports.length > 0}
                                <span
                                    class="font-mono text-[10px] text-vscode-description"
                                    >{c.ports.join(" · ")}</span
                                >
                            {/if}
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    {/if}
</div>
