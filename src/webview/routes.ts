import OnboardingPlaceholder from "./pages/placeholders/OnboardingPlaceholder.svelte";
import OverviewPlaceholder from "./pages/placeholders/OverviewPlaceholder.svelte";
import DockerPlaceholder from "./pages/placeholders/DockerPlaceholder.svelte";
import DeployPlaceholder from "./pages/placeholders/DeployPlaceholder.svelte";
import FirewallPlaceholder from "./pages/placeholders/FirewallPlaceholder.svelte";
import SnapshotsPlaceholder from "./pages/placeholders/SnapshotsPlaceholder.svelte";
import SettingsPlaceholder from "./pages/placeholders/SettingsPlaceholder.svelte";

export const routes = {
  "/onboarding": OnboardingPlaceholder,
  "/": OverviewPlaceholder,
  "/docker": DockerPlaceholder,
  "/deploy": DeployPlaceholder,
  "/firewall": FirewallPlaceholder,
  "/snapshots": SnapshotsPlaceholder,
  "/settings": SettingsPlaceholder,
  "*": OverviewPlaceholder,
};
