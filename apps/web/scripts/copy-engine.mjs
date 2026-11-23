// Copia o Stockfish (build WebAssembly oficial do pacote npm `stockfish`) para
// public/engine/, com a versão no nome dos arquivos. A pasta fica fora do git.
// Roda no `make setup-web` e antes do `dev` e do `build`; só copia o que mudou.
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const packageDir = dirname(require.resolve("stockfish/package.json"));
const { version } = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
const major = version.split(".")[0];

const webDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const targetDir = join(webDir, "public", "engine");
mkdirSync(targetDir, { recursive: true });

// Build completo multi-thread (exige isolamento de origem) e o de uma thread.
const builds = [
  { source: `stockfish-${major}`, target: `stockfish-${version}-mt` },
  { source: `stockfish-${major}-single`, target: `stockfish-${version}-st` },
];

function copyIfChanged(from, to) {
  if (existsSync(to) && statSync(to).size === statSync(from).size) {
    return false;
  }
  copyFileSync(from, to);
  return true;
}

let copied = 0;
for (const { source, target } of builds) {
  for (const extension of ["js", "wasm"]) {
    const from = join(packageDir, "bin", `${source}.${extension}`);
    if (copyIfChanged(from, join(targetDir, `${target}.${extension}`))) copied += 1;
  }
}
// Licença GPL-3.0 publicada junto com o motor.
if (copyIfChanged(join(packageDir, "Copying.txt"), join(targetDir, "Copying.txt"))) copied += 1;

if (copied > 0) {
  console.log(`Stockfish ${version}: ${copied} arquivo(s) copiado(s) para ${targetDir}`);
}
