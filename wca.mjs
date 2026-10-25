// Fetches Rufus's results from the WCA's public API and packs them into the shape stored in data.json.
// Shared by the app (Update data button) and scripts/update-data.mjs (daily GitHub Action).
export const WCA_ID = '2022CRIP01';
const API = 'https://www.worldcubeassociation.org/api/v0/persons/' + WCA_ID;

// Order of rounds within a competition. 0/h qualification, 1/d first, 2/e second, 3/g semi, b B-final, c/f final.
const ROUND_ORDER = '0h1d2e3gbcf';

async function getJson(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`WCA returned ${r.status} for ${url.split('/').pop()}`);
  return r.json();
}

export async function fetchWca() {
  const [person, results, comps, allRecords] = await Promise.all([
    getJson(API), getJson(API + '/results'), getJson(API + '/competitions'),
    getJson('https://www.worldcubeassociation.org/api/v0/records'),
  ]);
  const compMap = {};
  for (const c of comps) compMap[c.id] = [c.name, c.start_date];

  const prs = {};
  for (const [ev, pr] of Object.entries(person.personal_records || {})) {
    prs[ev] = {};
    for (const kind of ['single', 'average']) {
      const p = pr[kind];
      if (p) prs[ev][kind] = { best: p.best, wr: p.world_rank, cr: p.continent_rank, nr: p.country_rank };
    }
  }

  // World, continental (Europe) and national (UK) records, kept only for events Rufus has competed in.
  const { continent_id: continent, id: country } = person.person.country;
  const events = new Set(results.map(r => r.event_id));
  const keep = recs => Object.fromEntries(Object.entries(recs || {}).filter(([ev]) => events.has(ev)));
  const records = {
    wr: keep(allRecords.world_records),
    cr: keep((allRecords.continental_records || {})[continent]),
    nr: keep((allRecords.national_records || {})[country]),
  };

  // [competition, event, round type, place, best, average, attempts], oldest first.
  const rows = results.map(r => [r.competition_id, r.event_id, r.round_type_id, r.pos, r.best, r.average, r.attempts]);
  const date = id => (compMap[id] || ['', ''])[1];
  rows.sort((a, b) => date(a[0]).localeCompare(date(b[0])) || ROUND_ORDER.indexOf(a[2]) - ROUND_ORDER.indexOf(b[2]));
  if (rows.length < 100) throw new Error(`only ${rows.length} results came back from the WCA`);

  return {
    fetchedAt: new Date().toISOString(),
    name: person.person.name,
    wcaId: WCA_ID,
    competitionCount: person.competition_count,
    medals: person.medals,
    prs,
    records,
    comps: compMap,
    results: rows,
  };
}

// True when two data sets hold the same results and records (ignoring when they were fetched).
export function sameData(a, b) {
  const strip = d => JSON.stringify({ ...d, fetchedAt: '' });
  return !!a && !!b && strip(a) === strip(b);
}
