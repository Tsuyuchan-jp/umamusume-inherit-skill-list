/**
 * コース一覧を U-tools /race/tracks から作る。
 *
 *   node scripts/extract_utools_courses.mjs
 *   node scripts/extract_utools_courses.mjs --cache-only
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeRscChunks } from "./parse_utools_effects.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const UTOOLS = "https://xn--gck1f423k.xn--1bvt37a.tools";
const CACHE = path.join(ROOT, ".cache", "tracks.html");

function parseArgs(argv) {
  return { cacheOnly: argv.includes("--cache-only") };
}

async function loadHtml(cacheOnly) {
  if (fs.existsSync(CACHE)) return fs.readFileSync(CACHE, "utf8");
  if (cacheOnly) throw new Error("tracks cache missing");
  const res = await fetch(`${UTOOLS}/race/tracks`);
  if (!res.ok) throw new Error(`tracks HTTP ${res.status}`);
  const html = await res.text();
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, html);
  return html;
}

function normalizeGround(raw) {
  return raw === "芝" ? "芝" : "ダート";
}

export function parseCourses(html) {
  const joined = decodeRscChunks(html) + html;
  const headers = [...joined.matchAll(/header__name__[^"]*","children":"([^"]+)"/g)];
  const courses = [];
  const seen = new Set();

  for (let i = 0; i < headers.length; i++) {
    const place = headers[i][1];
    const start = headers[i].index;
    const end = i + 1 < headers.length ? headers[i + 1].index : joined.length;
    const block = joined.slice(start, end);
    // U-tools の距離チップは芝が「芝」、ダートが「ダ」（場ヘッダだけ「ダート」）
    const courseRe =
      /pathname":"\/race\/courses\/(\d+)"[\s\S]{0,500}?children":\[(\d+),"（","([^"]+)","）","([^"]+)"\][\s\S]{0,400}?children":"(芝|ダート|ダ)"/g;
    let m;
    while ((m = courseRe.exec(block))) {
      const id = Number(m[1]);
      if (seen.has(id)) continue;
      seen.add(id);
      const distance = Number(m[2]);
      const ground = normalizeGround(m[5]);
      courses.push({
        id,
        name: `${place} ${distance}m（${ground}）`,
        place,
        distance,
        distClass: m[3],
        turn: m[4],
        ground,
      });
    }
  }
  return courses.sort((a, b) => a.id - b.id);
}

async function main() {
  const opts = parseArgs(process.argv);
  const html = await loadHtml(opts.cacheOnly);
  const courses = parseCourses(html);
  const out = {
    source: `${UTOOLS}/race/tracks`,
    fetchedAt: new Date().toISOString(),
    count: courses.length,
    courses,
  };
  const dest = path.join(ROOT, "data", "courses.json");
  fs.writeFileSync(dest, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`courses: ${courses.length} → ${dest}`);
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
