import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

export async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function jsonFiles(inputPath) {
  const stat = await import('node:fs/promises').then(({ stat }) => stat(inputPath));
  if (stat.isFile()) return [inputPath];
  const entries = await readdir(inputPath, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
    .map((entry) => path.join(entry.parentPath ?? entry.path, entry.name))
    .sort();
}
