/**
 * Validate a Docker Compose project name per PRD §3.3.5:
 * alphanumeric, dashes, and underscores only. Must start with
 * an alphanumeric character and be 1..63 characters long.
 */
export function isValidDockerProjectName(name: string): boolean {
  if (typeof name !== "string") {
    return false;
  }
  if (name.length === 0 || name.length > 63) {
    return false;
  }
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name);
}
