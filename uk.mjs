// Builds uk.json: the winning average and the third-place average in the final of every event at every
// UK competition since Cheltenham Summer 2022. No competitor names are kept.
// Only competitions not already in the old file are fetched, so the daily run is quick.
// Used by scripts/update-data.mjs (daily GitHub Action).
const API = 'https://www.worldcubeassociation.org/api/v0';
const START = '2022-06-25';
const EVENTS = new Set(['333', '222', '444', '555', '666', '777', '333bf', '333fm', '333oh',
  'clock', 'minx', 'pyram', 'skewb', 'sq1']);

const sleep = ms => new Promise(res => setTimeout(res, ms));

// Retries with growing waits; the WCA answers 429 ("too many requests") if asked too quickly.
async function getJson(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (r.ok) return r.json();
      throw new Error(`WCA returned ${r.status}`);
    } catch (e) {
      if (attempt >= 6) throw e;
      await sleep(10000 * attempt);
    }
  }
}

async function ukCompetitions() {
  const end = new Date().toISOString().slice(0, 10);
  const all = [];
  for (let page = 1; ; page++) {
    const batch = await getJson(`${API}/competitions?country_iso2=GB&start=${START}&end=${end}&sort=start_date&per_page=100&page=${page}`);
    all.push(...batch);
    if (batch.length < 100) return all;
  }
}

// { event: [winning average, third-place average] } for one competition's finals; null where there isn't one.
function finals(results) {
  const out = {};
  for (const r of results) {
    if (!EVENTS.has(r.event_id) || (r.round_type_id !== 'f' && r.round_type_id !== 'c')) continue;
    if (r.pos !== 1 && r.pos !== 3) continue;
    const slot = out[r.event_id] || (out[r.event_id] = [null, null]);
    const i = r.pos === 1 ? 0 : 1;
    if (slot[i] === null && r.average > 0) slot[i] = r.average;
  }
  for (const [ev, v] of Object.entries(out)) if (v[0] === null && v[1] === null) delete out[ev];
  return out;
}

// old: a previous uk.json (or null). Returns the new one: { comps: [[id, name, date, finals], ...] } oldest first.
export async function updateUk(old) {
  const have = new Map(((old && old.comps) || []).map(c => [c[0], c]));
  for (const c of await ukCompetitions()) {
    if (have.has(c.id) || !c.results_posted_at || c.cancelled_at || c.start_date < START) continue;
    const results = await getJson(`${API}/competitions/${c.id}/results`);
    have.set(c.id, [c.id, c.name, c.start_date, finals(results)]);
    await sleep(500);
  }
  const comps = [...have.values()].sort((a, b) => a[2].localeCompare(b[2]) || a[0].localeCompare(b[0]));
  if (comps.length < 100) throw new Error(`only ${comps.length} UK competitions found`);
  return { comps };
}
