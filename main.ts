// NEON TIDE: Port Solara — our make.fun hand-in program.
// Package the offline city, missions and browser screenshots beside this file.
// The unchanged make.fun library describes those copied files in dossier.json.
// Run with Node 22.18+; MAKEFUN_OUTPUT_DIR overrides the grader's /output path.

import { cpSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repositoryDir = fileURLToPath(new URL('.', import.meta.url));
const screenshotByteLimit = 256 * 1024;

function requireGamePage(): void {
  const page = join(repositoryDir, 'game', 'index.html');
  if (!lstatSync(page, { throwIfNoEntry: false })?.isFile()) {
    throw new Error('game/index.html must exist as a regular file before hand-in.');
  }
}

function validateScreenshots(): void {
  const directory = join(repositoryDir, 'screenshots');
  if (!lstatSync(directory, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error('screenshots/ must contain 3 or 4 JPEG or PNG renders of Port Solara.');
  }
  const entries = readdirSync(directory, { withFileTypes: true });
  if (entries.length < 3 || entries.length > 4) {
    throw new Error(`screenshots/ contains ${entries.length} entries; expected 3 or 4 images.`);
  }
  for (const entry of entries) {
    const filename = join(directory, entry.name);
    if (!entry.isFile() || !/^[a-z0-9_][a-z0-9_.-]{0,127}$/i.test(entry.name)
      || !/\.(?:jpe?g|png)$/i.test(entry.name)) {
      throw new Error(`screenshots/${entry.name} must be a regular JPEG or PNG with a valid filename.`);
    }
    const size = lstatSync(filename).size;
    if (size > screenshotByteLimit) {
      throw new Error(`screenshots/${entry.name} is ${size} bytes; the limit is 256 KiB.`);
    }
    const bytes = readFileSync(filename);
    const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg = bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (!png && !jpeg) {
      throw new Error(`screenshots/${entry.name} has no PNG or JPEG signature.`);
    }
  }
}

function copyHandInFolder(name: 'game' | 'screenshots', outputDir: string): void {
  cpSync(join(repositoryDir, name), join(outputDir, name), { recursive: true });
}

function countFiles(directory: string): number {
  return readdirSync(directory, { withFileTypes: true }).reduce((total, entry) => {
    if (entry.isDirectory()) return total + countFiles(join(directory, entry.name));
    return total + (entry.isFile() ? 1 : 0);
  }, 0);
}

function handInPortSolara(): void {
  requireGamePage();
  validateScreenshots();

  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(outputDir, { recursive: true });
  copyHandInFolder('game', outputDir);
  copyHandInFolder('screenshots', outputDir);

  // Keep the dossier's source budget and refusal limits aligned with the kit.
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: screenshotByteLimit },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);

  const gameFiles = countFiles(join(outputDir, 'game'));
  const screenshotFiles = countFiles(join(outputDir, 'screenshots'));
  console.log(`NEON TIDE hand-in ready at ${outputDir}: ${gameFiles} game files, ${screenshotFiles} screenshots, dossier.json ${dossier.byteLength} bytes.`);
}

try {
  handInPortSolara();
} catch (error) {
  console.error(`NEON TIDE hand-in failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
