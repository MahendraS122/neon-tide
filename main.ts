// Validate and package NEON TIDE: Port Solara for the make.fun hand-in.
import { copyFileSync, lstatSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { buildDossier } from './vendor/makefun-game.ts';

const repo = import.meta.dirname;
const screenshotCap = { max: 4, max_bytes: 256 * 1024 };
const dossierCaps: Parameters<typeof buildDossier>[1] = {
  screenshots: screenshotCap,
  text_max_bytes: 1024 * 1024,
  game_max_files: 1024,
  game_max_bytes: 64 * 1024 * 1024,
  game_path_max_bytes: 256,
};

type Tree = { dirs: string[]; files: string[] };

function resolveOutputDir(): string {
  return resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
}

function assertGameEntry(): void {
  const entry = lstatSync(join(repo, 'game/index.html'), { throwIfNoEntry: false });
  if (!entry?.isFile()) throw new Error('Expected a regular file at game/index.html');
}

function scanTree(root: string): Tree {
  const tree: Tree = { dirs: [], files: [] };
  function visit(path: string): void {
    const source = join(repo, path);
    const info = lstatSync(source);
    if (info.isDirectory()) {
      tree.dirs.push(path);
      for (const name of readdirSync(source).sort()) visit(`${path}/${name}`);
    } else if (info.isFile()) {
      tree.files.push(path);
    } else {
      throw new Error(`Cannot hand in ${path}: expected a regular file or directory`);
    }
  }
  visit(root);
  if (tree.dirs[0] !== root) throw new Error(`Expected a directory at ${root}/`);
  return tree;
}

function collectScreenshots(tree: Tree): string[] {
  const images = tree.files.filter((path) => /^screenshots\/[^/]+\.(png|jpe?g)$/i.test(path));
  if (images.length < 3 || images.length > screenshotCap.max) {
    throw new Error(`Expected 3 or 4 PNG/JPEG files in screenshots/; found ${images.length}`);
  }
  for (const path of images) {
    if (lstatSync(join(repo, path)).size > screenshotCap.max_bytes) {
      throw new Error(`${path} exceeds the 256 KiB limit`);
    }
  }
  return images;
}

function copyTree(tree: Tree, output: string): void {
  for (const dir of tree.dirs) mkdirSync(join(output, dir), { recursive: true });
  for (const path of tree.files) copyFileSync(join(repo, path), join(output, path));
}

function writeDossier(output: string, bytes: Uint8Array): void {
  writeFileSync(join(output, 'dossier.json'), bytes);
}

function main(): void {
  const { values: flags } = parseArgs({
    options: {
      'dry-run': { type: 'boolean' },
      quiet: { type: 'boolean' },
      list: { type: 'boolean' },
    },
  });

  const output = resolveOutputDir();
  assertGameEntry();
  const game = scanTree('game');
  const screenshotTree = scanTree('screenshots');
  const screenshots = collectScreenshots(screenshotTree);
  const dossier = buildDossier(repo, dossierCaps);

  if (flags.list) {
    console.log([...game.files, ...screenshotTree.files, 'dossier.json'].sort().join('\n'));
    return;
  }

  if (!flags['dry-run']) {
    copyTree(game, output);
    copyTree(screenshotTree, output);
    writeDossier(output, dossier);
  }

  if (!flags.quiet) {
    const action = flags['dry-run'] ? 'dry run (nothing written)' : 'handed in';
    const size = (dossier.byteLength / 1024).toFixed(1);
    console.log(`NEON TIDE: Port Solara ${action}: ${game.files.length} game files, ${screenshots.length} screenshots, dossier ${size} KB`);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
