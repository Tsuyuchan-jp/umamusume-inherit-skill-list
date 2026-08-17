/**
 * U-tools 有効スキルを取得して data/effects に保存する。
 *
 *   node scripts/extract_utools_effects.mjs --course 10606
 *   node scripts/extract_utools_effects.mjs --course 10606 --style leader --cache-only
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  STYLE_IDS,
  filterWhiteCommon,
  parseRankedSkillsFromHtml,
} from "./parse_utools_effects.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const CACHE_DIR = path.join(ROOT, ".cache");
const UTOOLS = "https://xn--gck1f423k.xn--1bvt37a.tools";

function parseArgs(argv) {
  const opts = { course: null, style: null, cacheOnly: false, delayMs: 800 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--course") opts.course = Number(argv[++i]);
    else if (a === "--style") opts.style = argv[++i];
    else if (a === "--cache-only") opts.cacheOnly = true;
    else if (a === "--delay") opts.delayMs = Number(argv[++i]);
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

async function main() {
  const opts = parseArgs(process.argv);
  const courseId = opts.course || 10606;
  const styles = opts.style ? [opts.style] : STYLE_IDS;
  fs.mkdirSync(CACHE_DIR, { recursive: true });

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
  refreshAvailableIndex();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
