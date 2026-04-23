import Onboarding from "./pages/Onboarding.svelte";
import Overview from "./pages/Overview.svelte";
import Settings from "./pages/Settings.svelte";
import DockerPlaceholder from "./pages/placeholders/DockerPlaceholder.svelte";
import DeployPlaceholder from "./pages/placeholders/DeployPlaceholder.svelte";
import FirewallPlaceholder from "./pages/placeholders/FirewallPlaceholder.svelte";
import SnapshotsPlaceholder from "./pages/placeholders/SnapshotsPlaceholder.svelte";

export const routes = {
  "/onboarding": Onboarding,
  "/": Overview,
  "/docker": DockerPlaceholder,
  "/deploy": DeployPlaceholder,
  "/firewall": FirewallPlaceholder,
  "/snapshots": SnapshotsPlaceholder,
  "/settings": Settings,
  "*": Overview,
};
