// Validates the NEON TIDE entry and hands its game, screenshots, and dossier to make.fun.
import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = dirname(fileURLToPath(import.meta.url));
const screenshotLimit = 256 * 1024;

function resolveOutputDir(): string {
  return resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
}

async function assertGameEntry(): Promise<void> {
  const entry = join(root, 'game', 'index.html');
  if (!(await stat(entry)).isFile()) {
    throw new Error('game/index.html must be a regular file');
  }
}

async function collectScreenshots(): Promise<string[]> {
  const dir = join(root, 'screenshots');
  const names = (await readdir(dir)).sort((a, b) => a.localeCompare(b));
  const screenshots: string[] = [];

  for (const name of names) {
    if (!/\.(png|jpe?g)$/i.test(name)) continue;
    const path = join(dir, name);
    const info = await stat(path);
    if (!info.isFile()) throw new Error(`Screenshot is not a regular file: ${name}`);
    if (info.size > screenshotLimit) throw new Error(`Screenshot exceeds 256 KiB: ${name}`);
    screenshots.push(name);
  }

  if (screenshots.length < 3 || screenshots.length > 4) {
    throw new Error(`Expected 3 or 4 PNG/JPEG screenshots; found ${screenshots.length}`);
  }
  return screenshots;
}

async function copyTree(source: string, destination: string): Promise<number> {
  await mkdir(destination, { recursive: true });
  let files = 0;
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const from = join(source, entry.name);
    const to = join(destination, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not allowed: ${from}`);
    if (entry.isDirectory()) {
      files += await copyTree(from, to);
    } else if (entry.isFile()) {
      await copyFile(from, to);
      files += 1;
    } else {
      throw new Error(`Unsupported filesystem entry: ${from}`);
    }
  }
  return files;
}

async function writeDossier(outputDir: string, dryRun = false): Promise<number> {
  const bytes = buildDossier(root, {
    text_max_bytes: 160 * 1024,
    screenshots: { max: 4, max_bytes: screenshotLimit },
    game_max_files: 993,
    game_max_bytes: 48 * 1024 * 1024,
    game_path_max_bytes: 1000,
  });
  const dossier = Buffer.from(bytes);
  const json = JSON.parse(dossier.toString('utf8')) as unknown;
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new Error('buildDossier did not return a JSON object');
  }
  if (dossier.byteLength > 1.5 * 1024 * 1024) throw new Error('Dossier exceeds 1.5 MiB');
  if (!dryRun) await writeFile(join(outputDir, 'dossier.json'), dossier);
  return dossier.byteLength;
}

async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes('--dry-run');
  const extraArgs = process.argv.slice(2).filter((arg) => arg !== '--dry-run');
  if (extraArgs.length) throw new Error(`Unknown argument: ${extraArgs[0]}`);

  await assertGameEntry();
  const screenshots = await collectScreenshots();
  const outputDir = resolveOutputDir();
  let gameFiles: number;
  let dossierBytes: number;

  if (dryRun) {
    gameFiles = await countTreeFiles(join(root, 'game'));
    dossierBytes = await writeDossier(outputDir, true);
  } else {
    await mkdir(outputDir, { recursive: true });
    gameFiles = await copyTree(join(root, 'game'), join(outputDir, 'game'));
    await mkdir(join(outputDir, 'screenshots'), { recursive: true });
    for (const name of screenshots) {
      await copyFile(join(root, 'screenshots', name), join(outputDir, 'screenshots', name));
    }
    dossierBytes = await writeDossier(outputDir);
  }

  const dossierKb = (dossierBytes / 1024).toFixed(1);
  console.log(`NEON TIDE: Port Solara handed in: ${gameFiles} game files, ${screenshots.length} screenshots, dossier ${dossierKb} KB`);
}

async function countTreeFiles(source: string): Promise<number> {
  let files = 0;
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const path = join(source, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not allowed: ${path}`);
    if (entry.isDirectory()) files += await countTreeFiles(path);
    else if (entry.isFile()) files += 1;
    else throw new Error(`Unsupported filesystem entry: ${path}`);
  }
  return files;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
