/**
 * U-tools 有効スキルを取得して data/effects に保存する。
 *
 *   node scripts/extract_utools_effects.mjs --course 10606
 *   node scripts/extract_utools_effects.mjs --course 10606 --style leader --cache-only
 *   node scripts/extract_utools_effects.mjs --from-tracks
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEffectCourseIds } from "./extract_utools_courses.mjs";
import {
  STYLE_IDS,
  filterWhiteCommon,
  parseRankedSkillsFromHtml,
} from "./parse_utools_effects.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const CACHE_DIR = path.join(ROOT, ".cache");
const TRACKS_CACHE = path.join(CACHE_DIR, "tracks.html");
const UTOOLS = "https://xn--gck1f423k.xn--1bvt37a.tools";

function parseArgs(argv) {
  const opts = {
    courses: [],
    style: null,
    cacheOnly: false,
    delayMs: 800,
    fromTracks: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--course") opts.courses.push(Number(argv[++i]));
    else if (a === "--style") opts.style = argv[++i];
    else if (a === "--cache-only") opts.cacheOnly = true;
    else if (a === "--delay") opts.delayMs = Number(argv[++i]);
    else if (a === "--from-tracks") opts.fromTracks = true;
  }
  return opts;
}

function cachePath(courseId, style) {
  return path.join(CACHE_DIR, `course-${courseId}-${style}.html`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function loadHtml(courseId, style, { cacheOnly }) {
  const file = cachePath(courseId, style);
  if (fs.existsSync(file)) {
    return fs.readFileSync(file, "utf8");
  }
  const legacy = path.join(CACHE_DIR, "tokyo2400-leader.html");
  if (courseId === 10606 && style === "leader" && fs.existsSync(legacy)) {
    return fs.readFileSync(legacy, "utf8");
  }
  if (cacheOnly) {
    throw new Error(`cache missing: ${courseId}/${style}`);
  }
  const url = `${UTOOLS}/race/courses/${courseId}/effects/${style}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} → HTTP ${res.status}`);
  const html = await res.text();
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(file, html);
  return html;
}

function writeEffectJson(courseId, style, ranked) {
  const whiteCommon = filterWhiteCommon(ranked);
  const dir = path.join(DATA_DIR, "effects", String(courseId));
  fs.mkdirSync(dir, { recursive: true });
  const out = {
    courseId,
    style,
    source: `${UTOOLS}/race/courses/${courseId}/effects/${style}`,
    fetchedAt: new Date().toISOString(),
    rankedCount: ranked.length,
    whiteCommonCount: whiteCommon.length,
    skills: whiteCommon.map((s) => ({
      id: s.id,
      name: s.name,
      expectedEffect: s.expectedEffect,
      needSkillPoint: s.needSkillPoint,
      desc: s.desc || "",
      effectTags: s.effectTags || [],
      phaseTags: s.phaseTags || [],
      aptTags: s.aptTags || [],
      rateGroups: s.rateGroups || [],
    })),
  };
  const dest = path.join(dir, `${style}.json`);
  fs.writeFileSync(dest, `${JSON.stringify(out, null, 2)}\n`);
  return out;
}

function refreshAvailableIndex() {
  const effectsRoot = path.join(DATA_DIR, "effects");
  if (!fs.existsSync(effectsRoot)) return;
  const courseIds = fs
    .readdirSync(effectsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d+$/.test(d.name))
    .filter((d) => {
      const dir = path.join(effectsRoot, d.name);
      return fs.readdirSync(dir).some((f) => f.endsWith(".json"));
    })
    .map((d) => Number(d.name))
    .sort((a, b) => a - b);
  const dest = path.join(effectsRoot, "available.json");
  fs.writeFileSync(dest, `${JSON.stringify({ courseIds }, null, 2)}\n`);
}

function isComplete(courseId, styles) {
  const dir = path.join(DATA_DIR, "effects", String(courseId));
  return styles.every((style) => fs.existsSync(path.join(dir, `${style}.json`)));
}

async function loadTracksHtml(cacheOnly) {
  if (cacheOnly) {
    if (!fs.existsSync(TRACKS_CACHE)) throw new Error("tracks cache missing");
    return fs.readFileSync(TRACKS_CACHE, "utf8");
  }
  const res = await fetch(`${UTOOLS}/race/tracks`);
  if (!res.ok) throw new Error(`tracks HTTP ${res.status}`);
  const html = await res.text();
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(TRACKS_CACHE, html);
  return html;
}

async function extractCourse(courseId, styles, opts) {
  for (let i = 0; i < styles.length; i++) {
    const style = styles[i];
    if (i > 0 && !opts.cacheOnly) await sleep(opts.delayMs);
    const html = await loadHtml(courseId, style, opts);
    const ranked = parseRankedSkillsFromHtml(html);
    const out = writeEffectJson(courseId, style, ranked);
    console.log(
      `${courseId}/${style}: ranked=${out.rankedCount} white∩共通=${out.whiteCommonCount}`
    );
  }
}

async function main() {
  const opts = parseArgs(process.argv);
  const styles = opts.style ? [opts.style] : STYLE_IDS;
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  let courseIds = opts.courses.filter((id) => Number.isFinite(id) && id > 0);
  if (opts.fromTracks) {
    const tracksHtml = await loadTracksHtml(opts.cacheOnly);
    courseIds = parseEffectCourseIds(tracksHtml);
    console.log(`tracks の印あり: ${courseIds.length} 件`);
  }
  if (courseIds.length === 0) courseIds = [10606];

  const failures = [];
  let extracted = 0;
  for (let i = 0; i < courseIds.length; i++) {
    const courseId = courseIds[i];
    if (opts.fromTracks && isComplete(courseId, styles)) {
      console.log(`${courseId}: 既存のためスキップ`);
      continue;
    }
    if (extracted > 0 && !opts.cacheOnly) await sleep(opts.delayMs);
    try {
      await extractCourse(courseId, styles, opts);
      extracted += 1;
      refreshAvailableIndex();
    } catch (err) {
      console.error(`${courseId}: ${err.message || err}`);
      failures.push(courseId);
    }
  }
  refreshAvailableIndex();
  console.log(`完了: 新規 ${extracted} 件 / 失敗 ${failures.length} 件`);
  if (failures.length) {
    throw new Error(`失敗: ${failures.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
