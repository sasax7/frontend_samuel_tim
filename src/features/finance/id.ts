export function uid(prefix = "id") {
  // Reasonably unique for client-side usage; backend can replace with UUID later.
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
