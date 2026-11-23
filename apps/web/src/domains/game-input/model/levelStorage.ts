import type { Level } from "./types";

export const LEVEL_STORAGE_KEY = "analisador.level";

const VALID: readonly Level[] = ["beginner", "intermediate", "advanced"];

export type LevelStorage = Pick<Storage, "getItem" | "setItem">;

/** C-15: nível lembrado neste navegador; sem armazenamento, volta para Iniciante. */
export function loadLevel(storage: LevelStorage | undefined): Level {
  try {
    const stored = storage?.getItem(LEVEL_STORAGE_KEY);
    return VALID.find((level) => level === stored) ?? "beginner";
  } catch {
    return "beginner";
  }
}

export function saveLevel(storage: LevelStorage | undefined, level: Level): void {
  try {
    storage?.setItem(LEVEL_STORAGE_KEY, level);
  } catch {
    // Armazenamento indisponível (modo privado, cota): o nível só não é lembrado.
  }
}
