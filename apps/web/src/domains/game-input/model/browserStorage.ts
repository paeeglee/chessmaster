import type { LevelStorage } from "./levelStorage";

/** O localStorage do navegador, ou undefined quando o acesso é bloqueado. */
export function browserStorage(): LevelStorage | undefined {
  try {
    return globalThis.localStorage ?? undefined;
  } catch {
    return undefined;
  }
}
