/**
 * Shared onError handler for React Query mutations. The global MutationCache
 * handler in App.tsx only logs to the console — it has no way to tell whether a
 * specific .mutate() call already has its own onError (see the comment there),
 * so every user-facing save/delete needs to pass this explicitly instead.
 */
export function alertMutationError(err: any): void {
  const msg = err?.response?.data?.error || err?.message || 'Er is een fout opgetreden. Probeer opnieuw.';
  alert(`Opslaan mislukt: ${msg}`);
}
