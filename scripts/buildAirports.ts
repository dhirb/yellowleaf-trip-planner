/**
 * Regenerate `public/airports.json` from public, free airport datasets.
 *
 * Two community-maintained sources are merged:
 *
 *  - OurAirports (https://ourairports.com/data/, public domain) — the base
 *    list. It is broad and current, and carries the airport `type` we filter on
 *    (keep only large/medium airports that have an IATA code).
 *  - OpenFlights (https://openflights.org/data.html, ODbL) — used only for its
 *    `City` field, which is the *served city / metro* (e.g. "Kuala Lumpur" for
 *    KUL) rather than the airport's physical municipality ("Sepang"). We prefer
 *    this metro name and fall back to OurAirports' municipality when an airport
 *    isn't in OpenFlights.
 *
 * Output is a compact tuple array the app fetches lazily and searches in the
 * browser — no API keys, quotas, or runtime network calls:
 *
 *   [iata, name, city, country]   e.g. ["KUL","Kuala Lumpur International Airport","Kuala Lumpur","MY"]
 *
 * Usage:
 *   npm run build:airports
 *
 * The GitHub Actions workflow `.github/workflows/update-airports.yml` automates
 * this on a schedule and opens a PR when the data changes.
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/** Canonical, daily-updated mirror of the OurAirports CSVs. */
const OURAIRPORTS_URL =
  "https://davidmegginson.github.io/ourairports-data/airports.csv";

/** OpenFlights airports table (headerless CSV) — used for the metro city name. */
const OPENFLIGHTS_URL =
  "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat";

/** Only these airport types are worth offering in a trip planner. */
const KEEP_TYPES = new Set(["large_airport", "medium_airport"]);

/** A compact, JSON-friendly airport record. Order matches the runtime parser. */
type AirportTuple = [iata: string, name: string, city: string, country: string];

/**
 * Parse RFC-4180 CSV text into rows of string cells. Handles quoted fields,
 * embedded commas/newlines, and doubled `""` escapes — enough for both source
 * exports without pulling in a dependency.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  // Flush a trailing line that isn't newline-terminated.
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

async function fetchText(url: string): Promise<string> {
  console.log(`Fetching ${url} …`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Download failed (${res.status} ${res.statusText}): ${url}`,
    );
  }
  return res.text();
}

/**
 * Map IATA code → served-city name from OpenFlights. Columns are positional
 * (no header): [id, name, city, country, iata, icao, …]; "\\N" marks nulls.
 */
function openFlightsCities(text: string): Map<string, string> {
  const cities = new Map<string, string>();
  for (const r of parseCsv(text)) {
    const iata = r[4]?.trim().toUpperCase() ?? "";
    const city = r[2]?.trim() ?? "";
    if (/^[A-Z]{3}$/.test(iata) && city && city !== "\\N") {
      cities.set(iata, city);
    }
  }
  return cities;
}

async function main() {
  const [ourText, ofText] = await Promise.all([
    fetchText(OURAIRPORTS_URL),
    fetchText(OPENFLIGHTS_URL),
  ]);

  const metroCity = openFlightsCities(ofText);

  const rows = parseCsv(ourText);
  const header = rows[0];
  const col = (name: string) => {
    const idx = header.indexOf(name);
    if (idx === -1) throw new Error(`Missing expected CSV column: ${name}`);
    return idx;
  };
  const iIata = col("iata_code");
  const iType = col("type");
  const iName = col("name");
  const iCity = col("municipality");
  const iCountry = col("iso_country");

  // Keep the largest entry per IATA code (some codes appear more than once).
  const byIata = new Map<string, { tuple: AirportTuple; type: string }>();
  for (const r of rows.slice(1)) {
    const iata = r[iIata]?.trim().toUpperCase() ?? "";
    const type = r[iType] ?? "";
    if (!/^[A-Z]{3}$/.test(iata) || !KEEP_TYPES.has(type)) continue;

    // Prefer the OpenFlights metro city; fall back to the physical municipality.
    const city = metroCity.get(iata) ?? r[iCity]?.trim() ?? "";
    const tuple: AirportTuple = [
      iata,
      r[iName]?.trim() ?? "",
      city,
      r[iCountry]?.trim() ?? "",
    ];
    const existing = byIata.get(iata);
    // Prefer a large airport over a medium one sharing the same code.
    if (
      !existing ||
      (existing.type !== "large_airport" && type === "large_airport")
    ) {
      byIata.set(iata, { tuple, type });
    }
  }

  const airports = [...byIata.values()]
    .map((e) => e.tuple)
    .sort((a, b) => a[0].localeCompare(b[0]));

  const here = dirname(fileURLToPath(import.meta.url));
  const outPath = join(here, "..", "public", "airports.json");
  await writeFile(outPath, JSON.stringify(airports));

  const withMetro = airports.filter((a) => metroCity.has(a[0])).length;
  console.log(
    `Wrote ${airports.length} airports → ${outPath} (${withMetro} with OpenFlights metro names)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
