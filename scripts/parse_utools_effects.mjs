/**
 * U-tools 有効スキルページ（SSR HTML）から、獲得バ身順のスキルを取り出す。
 */

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
  const start = Math.max(0, effectIdx - 4000);
  return text.slice(start, effectIdx);
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
 * @returns {{ id: number, name: string, rarity: number, characterCardId: number|null, expectedEffect: number }[]}
 */
export function parseRankedSkillsFromHtml(html) {
  const joined = decodeRscChunks(html);
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
    if (!idM || !nameM) continue;
    const id = Number(idM[1]);
    if (seen.has(id)) continue;
    seen.add(id);
    ranked.push({
      id,
      name: unescapeJsonString(nameM[1]),
      rarity: rarityM ? Number(rarityM[1]) : null,
      skillCategory: catM ? Number(catM[1]) : null,
      characterCardId: charaM && charaM[1] !== "null" ? Number(charaM[1]) : null,
      expectedEffect: effect,
    });
  }
  ranked.sort((a, b) => b.expectedEffect - a.expectedEffect);
  return ranked;
}

export function filterWhiteCommon(ranked) {
  return ranked.filter(isWhiteCommonSkill);
}
