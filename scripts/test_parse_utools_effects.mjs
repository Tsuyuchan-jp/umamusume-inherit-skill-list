import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  filterWhiteCommon,
  parseRankedSkillsFromHtml,
} from "./parse_utools_effects.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = path.join(root, ".cache", "tokyo2400-leader.html");
if (!fs.existsSync(htmlPath)) {
  console.error("skip: tokyo2400-leader.html が無い");
  process.exit(0);
}

const html = fs.readFileSync(htmlPath, "utf8");
const ranked = parseRankedSkillsFromHtml(html);
const whiteCommon = filterWhiteCommon(ranked);

if (ranked.length < 50) {
  throw new Error(`ranked too small: ${ranked.length}`);
}
if (whiteCommon.length < 20) {
  throw new Error(`whiteCommon too small: ${whiteCommon.length}`);
}

const names = new Set(whiteCommon.map((s) => s.name));
if (names.has("セイリオス")) {
  throw new Error("unique skill leaked into white∩共通");
}
if (!names.has("左回り○") && !names.has("先行直線○") && !names.has("中距離直線○")) {
  throw new Error("expected a generic white skill in white∩共通");
}

const inheritUniques = ranked.filter(
  (s) => s.rarity === 1 && s.characterCardId != null
);
for (const u of inheritUniques) {
  if (whiteCommon.some((s) => s.id === u.id)) {
    throw new Error(`inherit unique leaked: ${u.name}`);
  }
}

console.log(
  `ok ranked=${ranked.length} whiteCommon=${whiteCommon.length} inheritUniqueWhite=${inheritUniques.length}`
);
console.log("top5 whiteCommon", whiteCommon.slice(0, 5).map((s) => s.name));
