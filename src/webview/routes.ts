import Onboarding from "./pages/Onboarding.svelte";
import Overview from "./pages/Overview.svelte";
import Settings from "./pages/Settings.svelte";
import Docker from "./pages/Docker.svelte";
import Snapshots from "./pages/Snapshots.svelte";
import DeployPlaceholder from "./pages/placeholders/DeployPlaceholder.svelte";
import FirewallPlaceholder from "./pages/placeholders/FirewallPlaceholder.svelte";

export const routes = {
  "/onboarding": Onboarding,
  "/": Overview,
  "/docker": Docker,
  "/deploy": DeployPlaceholder,
  "/firewall": FirewallPlaceholder,
  "/snapshots": Snapshots,
  "/settings": Settings,
  "*": Overview,
};
