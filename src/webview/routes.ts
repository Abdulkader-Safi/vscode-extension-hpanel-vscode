import Onboarding from "./pages/Onboarding.svelte";
import Overview from "./pages/Overview.svelte";
import DockerPlaceholder from "./pages/placeholders/DockerPlaceholder.svelte";
import DeployPlaceholder from "./pages/placeholders/DeployPlaceholder.svelte";
import FirewallPlaceholder from "./pages/placeholders/FirewallPlaceholder.svelte";
import SnapshotsPlaceholder from "./pages/placeholders/SnapshotsPlaceholder.svelte";
import SettingsPlaceholder from "./pages/placeholders/SettingsPlaceholder.svelte";

export const routes = {
  "/onboarding": Onboarding,
  "/": Overview,
  "/docker": DockerPlaceholder,
  "/deploy": DeployPlaceholder,
  "/firewall": FirewallPlaceholder,
  "/snapshots": SnapshotsPlaceholder,
  "/settings": SettingsPlaceholder,
  "*": Overview,
};
