// Validate NEON TIDE, copy its deliverables and write the official dossier on hand-in.
import { closeSync, cpSync, lstatSync, mkdirSync, openSync, readdirSync, readSync,
  statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));

function resolveOutputDir() {
  const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
  if (outputDir === resolve(repoDir)) {
    throw new Error('Output must not overwrite the source repository.');
  }
  return outputDir;
}

function assertGameEntry() {
  const entry = join(repoDir, 'game', 'index.html');
  if (!lstatSync(entry).isFile()) throw new Error('game/index.html must be a regular file.');
}

function collectScreenshots() {
  const directory = join(repoDir, 'screenshots');
  const files = readdirSync(directory).filter(name => !name.startsWith('.')).sort();
  if (files.length < 3 || files.length > 4) {
    throw new Error('screenshots/ must contain three or four image files.');
  }
  for (const name of files) {
    if (!/^[A-Za-z0-9._-]{1,128}$/.test(name) || name.startsWith('-')) {
      throw new Error(`Invalid screenshot filename: ${name}`);
    }
    const path = join(directory, name);
    const info = lstatSync(path);
    if (!info.isFile() || info.size > 262144) throw new Error(`Invalid screenshot: ${name}`);
    const header = Buffer.alloc(3);
    const fd = openSync(path, 'r');
    try {
      readSync(fd, header, 0, header.length, 0);
    } finally {
      closeSync(fd);
    }
    const jpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    const png = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e;
    if (!jpeg && !png) throw new Error(`Screenshot is not JPEG or PNG: ${name}`);
  }
  return files;
}

function copyTree(source, destination) {
  cpSync(source, destination, { recursive: true, dereference: false, errorOnExist: false });
}

function writeDossier(outputDir) {
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
  return Buffer.byteLength(dossier);
}

function main() {
  assertGameEntry();
  const screenshots = collectScreenshots();
  const outputDir = resolveOutputDir();
  mkdirSync(outputDir, { recursive: true });
  copyTree(join(repoDir, 'game'), join(outputDir, 'game'));
  copyTree(join(repoDir, 'screenshots'), join(outputDir, 'screenshots'));
  const dossierBytes = writeDossier(outputDir);
  console.log(`Handed in NEON TIDE: game, ${screenshots.length} screenshots, dossier (${dossierBytes} bytes).`);
}

main();
