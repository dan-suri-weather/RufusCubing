RUFUSCUBING
===========

A quick reference to Rufus's speedcubing results, taken from his WCA profile:
https://www.worldcubeassociation.org/persons/2022CRIP01
It runs in Safari on an iPhone or iPad and can be added to the Home Screen so it opens like an app.


FILES
-----

index.html                          The whole app
wca.mjs                             Fetches results from the WCA (used by the app and the daily job)
data.json                           The app's copy of Rufus's results
sw.js, manifest.webmanifest,        Let it work offline and install to the Home Screen
icon-180.png, icon-192.png,
icon-512.png
icons/                              The WCA event symbols (cubing-icons font, MIT licence)
vendor/chart.umd.js                 Chart.js, which draws the graphs
scripts/update-data.mjs and         Checks the WCA every day and updates data.json
.github/workflows/update-data.yml   when there are new results


PUTTING IT ONLINE (one-off)
---------------------------

1. Upload everything in this folder to dan-suri-weather/RufusCubing, including the .github folder.
2. Go to Settings > Pages. Under "Build and deployment", choose "Deploy from a branch",
   pick main and / (root), then click Save.
3. After a minute or two the app is live at https://dan-suri-weather.github.io/RufusCubing/
4. Go to Settings > Actions > General > Workflow permissions, choose
   "Read and write permissions", then click Save.
   This lets the daily update job save new results.


INSTALLING ON AN IPHONE
-----------------------

1. Open https://dan-suri-weather.github.io/RufusCubing/ in Safari.
2. Tap Share > Add to Home Screen > Add.
3. Open it from the Home Screen icon.


USING IT
--------

- PRs shows the Current Personal Records table and the Medal Collection, as on the WCA page.
  Tap an event in the table to go to its page.
- Each event button opens a page with that event's personal records line and three graphs:
    Solves     every solve in order, oldest first
    Average    the average for every round taken part in, oldest first
    Frequency  how many solves fall into each time band
  DNF and DNS leave a gap in the Solves and Average graphs and are left out of Frequency.
  Touch the graph to see the time, competition, round and date for a point.
- Fewest Moves graphs are in moves rather than seconds.
- Update data fetches the latest results straight from the WCA.
  If that fails it uses data.json, which the GitHub Action refreshes every morning.


HOW THE DAILY UPDATE WORKS
--------------------------

The GitHub Action "Update data" runs at 05:00 UTC every day. It reads Rufus's results from the
WCA's public API and saves them to data.json, but only when something has changed.
When the app opens, it picks up a newer data.json by itself.
To run it straight away, open the repo's Actions tab, pick "Update data", and click "Run workflow".
