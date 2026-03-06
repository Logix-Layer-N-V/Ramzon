import PocketBase from 'pocketbase';

const PB_URL = (import.meta as any).env?.VITE_PB_URL || 'http://localhost:8090';

export const pb = new PocketBase(PB_URL);

/** Returns true if PocketBase is configured and reachable (cached per session). */
let _pbAvailable: boolean | null = null;
export async function isPbAvailable(): Promise<boolean> {
  if (_pbAvailable !== null) return _pbAvailable;
  try {
    await pb.health.check();
    _pbAvailable = true;
  } catch {
    _pbAvailable = false;
  }
  return _pbAvailable;
}
