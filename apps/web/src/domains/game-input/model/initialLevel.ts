import { browserStorage } from "./browserStorage";
import { loadLevel } from "./levelStorage";
import type { Level } from "./types";

/** Nível inicial da tela Colar: o último usado neste navegador ou Iniciante. */
export function initialLevel(): Level {
  return loadLevel(browserStorage());
}
