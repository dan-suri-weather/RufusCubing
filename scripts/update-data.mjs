// Refreshes data.json (Rufus's results) and uk.json (UK winning and podium averages) from the WCA.
// Each file is only rewritten when something has changed, so the daily job doesn't make a commit every day.
// Run by .github/workflows/update-data.yml.
import { readFile, writeFile } from 'node:fs/promises';
import { fetchWca, sameData } from '../wca.mjs';
import { updateUk } from '../uk.mjs';

const DATA = new URL('../data.json', import.meta.url);
const UK = new URL('../uk.json', import.meta.url);

async function readJson(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch (e) { return null; /* first run */ }
}

const fresh = await fetchWca();
const old = await readJson(DATA);
if (sameData(old, fresh)) console.log('No new results for Rufus.');
else {
  await writeFile(DATA, JSON.stringify(fresh) + '\n');
  console.log(`Saved ${fresh.results.length} results from ${Object.keys(fresh.comps).length} competitions.`);
}

const oldUk = await readJson(UK);
const uk = await updateUk(oldUk);
if (oldUk && oldUk.comps.length === uk.comps.length) console.log('No new UK competitions.');
else {
  await writeFile(UK, JSON.stringify({ updatedAt: new Date().toISOString(), ...uk }) + '\n');
  console.log(`Saved ${uk.comps.length} UK competitions.`);
}
