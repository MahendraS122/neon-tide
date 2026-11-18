// Package NEON TIDE: Port Solara and build its make.fun judging dossier.
import { copyFileSync, lstatSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const gameDir = join(import.meta.dirname, 'game');
const screenshotDir = join(import.meta.dirname, 'screenshots');
const maxScreenshots = 4;
const maxScreenshotBytes = 256 * 1024;
const maxDossierTextBytes = 160 * 1024;

function resolveOutputDir(): string {
  return resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
}

function assertGameEntry(): void {
  const entry = lstatSync(join(gameDir, 'index.html'), { throwIfNoEntry: false });
  if (!entry?.isFile()) {
    throw new Error('game/index.html must be a regular file');
  }
}

function collectScreenshots(): string[] {
  const images = readdirSync(screenshotDir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.'));

  if (images.length < 3 || images.length > maxScreenshots) {
    throw new Error(`Expected 3 or 4 screenshots, found ${images.length}`);
  }

  return images.map((entry) => {
    if (!entry.isFile() || !/^[a-z0-9_][a-z0-9_.-]*\.(png|jpe?g)$/i.test(entry.name)
        || entry.name.length > 128) {
      throw new Error(`Invalid PNG or JPEG screenshot name or file: ${entry.name}`);
    }
    if (lstatSync(join(screenshotDir, entry.name)).size > maxScreenshotBytes) {
      throw new Error(`Screenshot exceeds 256 KiB: ${entry.name}`);
    }
    return entry.name;
  }).sort();
}

function copyTree(source: string, destination: string): number {
  const entries = readdirSync(source, { withFileTypes: true });
  mkdirSync(destination, { recursive: true });
  let files = 0;
  for (const entry of entries) {
    const from = join(source, entry.name);
    const to = join(destination, entry.name);
    if (entry.isDirectory()) {
      files += copyTree(from, to);
    } else if (entry.isFile()) {
      copyFileSync(from, to);
      files += 1;
    } else {
      throw new Error(`Expected a regular game file or directory: ${from}`);
    }
  }
  return files;
}

function writeDossier(outputDir: string): number {
  const dossier = buildDossier(outputDir, {
    text_max_bytes: maxDossierTextBytes,
    screenshots: { max: maxScreenshots, max_bytes: maxScreenshotBytes },
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
  return dossier.byteLength;
}

function main(): void {
  const outputDir = resolveOutputDir();
  assertGameEntry();
  const screenshots = collectScreenshots();
  const gameFiles = copyTree(gameDir, join(outputDir, 'game'));

  const screenshotOutput = join(outputDir, 'screenshots');
  mkdirSync(screenshotOutput, { recursive: true });
  for (const name of screenshots) {
    copyFileSync(join(screenshotDir, name), join(screenshotOutput, name));
  }

  const dossierKB = (writeDossier(outputDir) / 1024).toFixed(1);
  console.log(`NEON TIDE: Port Solara handed in: ${gameFiles} game files, ${screenshots.length} screenshots, dossier ${dossierKB} KB`);
}

main();
