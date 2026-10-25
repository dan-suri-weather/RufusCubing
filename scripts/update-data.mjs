// Refreshes data.json from the WCA. Only rewrites the file when results or records have changed,
// so the daily job doesn't make a commit every day. Run by .github/workflows/update-data.yml.
import { readFile, writeFile } from 'node:fs/promises';
import { fetchWca, sameData } from '../wca.mjs';

const FILE = new URL('../data.json', import.meta.url);

const fresh = await fetchWca();
let old = null;
try { old = JSON.parse(await readFile(FILE, 'utf8')); } catch (e) { /* first run */ }
if (sameData(old, fresh)) { console.log('No new results.'); process.exit(0); }
await writeFile(FILE, JSON.stringify(fresh) + '\n');
console.log(`Saved ${fresh.results.length} results from ${Object.keys(fresh.comps).length} competitions.`);
