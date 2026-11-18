// Validate and hand in NEON TIDE's game, screenshots, and generated dossier.
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const projectDir = dirname(fileURLToPath(import.meta.url));
const screenshotLimit = 256 * 1024;

type TreeFile = { source: string; name: string };

function resolveOutputDir(): string {
  const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");
  const fromProject = relative(projectDir, outputDir);
  const toProject = relative(outputDir, projectDir);
  for (const folder of ["game", "screenshots", "vendor", ".git", ".makefun"]) {
    if (fromProject === folder || fromProject.startsWith(folder + sep)) {
      throw new Error(`Output directory overlaps protected project data: ${outputDir}`);
    }
  }
  if (toProject === "" || (!toProject.startsWith(".." + sep) && toProject !== "..")) {
    throw new Error("Output directory must not contain the repository.");
  }
  return outputDir;
}

function assertGameEntry(): void {
  const entry = join(projectDir, "game", "index.html");
  if (!existsSync(entry) || !statSync(entry).isFile()) {
    throw new Error("The game entry is missing: game/index.html");
  }
}

function listTree(directory: string, prefix = ""): TreeFile[] {
  const files: TreeFile[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    const source = join(directory, entry.name);
    const name = join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...listTree(source, name));
    } else if (entry.isFile()) {
      files.push({ source, name });
    } else {
      throw new Error(`Only regular files and directories are supported: ${source}`);
    }
  }
  return files;
}

function collectScreenshots(): TreeFile[] {
  const files = listTree(join(projectDir, "screenshots"));
  if (files.length < 3 || files.length > 4) {
    throw new Error(`Expected 3 or 4 screenshots; found ${files.length}.`);
  }
  for (const file of files) {
    if (!/\.(png|jpe?g)$/i.test(file.name)) {
      throw new Error(`Screenshot must be PNG or JPEG: ${file.name}`);
    }
    const size = lstatSync(file.source).size;
    if (size === 0 || size > screenshotLimit) {
      throw new Error(`Screenshot must be nonempty and at most 256 KiB: ${file.name}`);
    }
  }
  return files;
}

function copyTree(files: TreeFile[], destination: string): void {
  mkdirSync(destination, { recursive: true });
  for (const file of files) {
    const target = join(destination, file.name);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(file.source, target);
  }
}

function writeDossier(outputDir: string, dossier: Uint8Array): void {
  writeFileSync(join(outputDir, "dossier.json"), dossier);
}

function main(): void {
  const flags = new Set(process.argv.slice(2));
  for (const flag of flags) {
    if (flag !== "--dry-run" && flag !== "--quiet") {
      throw new Error(`Unknown argument: ${flag}`);
    }
  }
  const outputDir = resolveOutputDir();
  assertGameEntry();
  const screenshots = collectScreenshots();
  const gameFiles = listTree(join(projectDir, "game"));
  const dossier = buildDossier(projectDir, { text_max_bytes: 256 * 1024 });

  if (!flags.has("--dry-run")) {
    copyTree(gameFiles, join(outputDir, "game"));
    copyTree(screenshots, join(outputDir, "screenshots"));
    writeDossier(outputDir, dossier);
  }
  if (!flags.has("--quiet")) {
    console.log(`NEON TIDE: Port Solara handed in: ${gameFiles.length} game files, ${screenshots.length} screenshots, dossier ${(dossier.byteLength / 1024).toFixed(1)} KB`);
  }
}

try {
  main();
} catch (error) {
  console.error(`Hand-in failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
