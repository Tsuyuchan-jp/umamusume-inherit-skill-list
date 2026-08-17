/**
 * U-tools 有効スキルページ（SSR HTML）から、獲得バ身順のスキルを取り出す。
 */
import { summarizePatterns } from "../app/js/skillDetail.js";

export const STYLE_IDS = ["runner", "leader", "betweener", "chaser"];

export function decodeRscChunks(html) {
  const rscChunks = [
    ...html.matchAll(/self\.__next_f\.push\(\[1,"((?:\\.|[^"\\])*)"\]\)/g),
  ];
  return rscChunks
    .map(([, c]) =>
      c.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\")
    )
    .join("");
}

/** expectedEffect 直前のフィールドだけを見る（ネストした {} を跨がない） */
function sliceBeforeEffect(text, effectIdx) {
  const start = Math.max(0, effectIdx - 8000);
  return text.slice(start, effectIdx);
}

function readBalanced(text, start) {
  const open = text[start];
  const close = open === "[" ? "]" : "}";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (ch === "\\") {
        esc = true;
        continue;
      }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function firstJsonValue(slice, key) {
  const needle = `"${key}":`;
  const idx = slice.indexOf(needle);
  if (idx < 0) return null;
  let i = idx + needle.length;
  while (slice[i] === " " || slice[i] === "\n") i++;
  if (slice[i] === '"') {
    const m = slice.slice(i).match(/^"((?:\\.|[^"\\])*)"/);
    return m ? unescapeJsonString(m[1]).replace(/\\n/g, "\n") : null;
  }
  if (slice[i] === "[" || slice[i] === "{") {
    const raw = readBalanced(slice, i);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

function collectDetailsById(joined) {
  const map = new Map();
  const nameRe = /"skillName":"((?:\\.|[^"\\])*)"/g;
  const matches = [...joined.matchAll(nameRe)];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const before = joined.slice(Math.max(0, m.index - 800), m.index);
    const idM = [...before.matchAll(/"id":(\d+)/g)].at(-1);
    if (!idM) continue;
    const id = Number(idM[1]);
    if (map.has(id)) continue;
    const end = i + 1 < matches.length ? matches[i + 1].index : m.index + 5000;
    const chunk = joined.slice(m.index, end);
    const patterns = firstJsonValue(chunk, "effectPatterns");
    if (!Array.isArray(patterns)) continue;
    const descRaw = firstJsonValue(chunk, "skillDesc");
    const tags = summarizePatterns(patterns);
    map.set(id, {
      desc: typeof descRaw === "string" ? descRaw.replace(/\\+\n/g, "\n").replace(/\\n/g, "\n") : "",
      ...tags,
    });
  }
  return map;
}

function unescapeJsonString(s) {
  return s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) =>
    String.fromCharCode(parseInt(h, 16))
  ).replace(/\\"/g, '"');
}

/**
 * 固有・進化固有（90xxxx / 1xxxxx / 4xxxxx）。
 */
export function isUniqueSkillId(id) {
  const n = Number(id);
  return (
    (n >= 100000 && n < 200000) ||
    (n >= 400000 && n < 500000) ||
    n >= 900000
  );
}

/**
 * シナリオスキル（U-tools の「シナリオスキル」チェック相当の近似）
 * 21xxxx 台はシナリオ由来が多い。
 */
export function isScenarioSkillId(id) {
  const n = Number(id);
  return n >= 210000 && n < 300000;
}

/**
 * 白 ∩ 共通。固有・シナリオ・継承固有（characterCardId あり）は除外。
 */
export function isWhiteCommonSkill(row) {
  if (row.rarity !== 1) return false;
  if (row.characterCardId != null) return false;
  if (isUniqueSkillId(row.id)) return false;
  if (isScenarioSkillId(row.id)) return false;
  if (row.skillCategory === 5) return false;
  return true;
}

/**
 * HTML から expectedEffect 付きスキルを獲得バ身降順で返す。
 * @returns {{ id: number, name: string, rarity: number, characterCardId: number|null, needSkillPoint: number|null, expectedEffect: number }[]}
 */
export function parseRankedSkillsFromHtml(html) {
  const joined = decodeRscChunks(html);
  const detailsById = collectDetailsById(joined);
  const ranked = [];
  const seen = new Set();
  const re = /"expectedEffect":([0-9.]+)/g;
  let m;
  while ((m = re.exec(joined))) {
    const effect = Number(m[1]);
    const slice = sliceBeforeEffect(joined, m.index);
    const idM = [...slice.matchAll(/"id":(\d+)/g)].at(-1);
    const rarityM = [...slice.matchAll(/"rarity":(\d+)/g)].at(-1);
    const nameM = [...slice.matchAll(/"skillName":"((?:\\.|[^"\\])*)"/g)].at(-1);
    const catM = [...slice.matchAll(/"skillCategory":(\d+)/g)].at(-1);
    const charaM = [...slice.matchAll(/"characterCardId":(null|\d+)/g)].at(-1);
    const ptM = [...slice.matchAll(/"needSkillPoint":(\d+)/g)].at(-1);
    if (!idM || !nameM) continue;
    const id = Number(idM[1]);
    if (seen.has(id)) continue;
    seen.add(id);
    const extra = detailsById.get(id) || {
      desc: "",
      effectTags: [],
      phaseTags: [],
      aptTags: [],
      rateGroups: [],
    };
    ranked.push({
      id,
      name: unescapeJsonString(nameM[1]),
      rarity: rarityM ? Number(rarityM[1]) : null,
      skillCategory: catM ? Number(catM[1]) : null,
      characterCardId: charaM && charaM[1] !== "null" ? Number(charaM[1]) : null,
      needSkillPoint: ptM ? Number(ptM[1]) : null,
      expectedEffect: effect,
      ...extra,
    });
  }
  ranked.sort((a, b) => b.expectedEffect - a.expectedEffect);
  return ranked;
}

export function filterWhiteCommon(ranked) {
  return ranked.filter(isWhiteCommonSkill);
}
