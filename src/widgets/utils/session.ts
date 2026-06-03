export function formatTime(timestamp: number | undefined): string {
  if (timestamp === undefined) return "";
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0m";
  const totalMinutes = Math.max(1, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function formatElapsed(first: number | undefined, last: number | undefined): string {
  if (first === undefined) return "0m";
  const end = last === undefined || last < first ? Date.now() : last;
  return formatDuration(end - first);
}
