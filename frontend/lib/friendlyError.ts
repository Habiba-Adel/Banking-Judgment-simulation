/**
 * Turns a caught fetch error into text safe to show a user — a raw
 * `TypeError: Failed to fetch` (the browser's message for "server
 * unreachable") is not something a non-technical user can act on.
 */
export function toFriendlyErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof TypeError && err.message === "Failed to fetch") {
    return "Can't reach the server right now — check your connection and try again.";
  }
  return err instanceof Error ? err.message : fallback;
}
