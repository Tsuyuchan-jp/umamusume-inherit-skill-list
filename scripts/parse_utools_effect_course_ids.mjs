/**
 * U-tools コース一覧 HTML から、有効スキルの金ドット付き courseId を取る。
 * 一覧 JSON の正本は工場（extract:courses）。ここでは effects 抽出用だけ残す。
 */
import { decodeRscChunks } from "./parse_utools_effects.mjs";

/** 有効スキルの金ドット（course__effect）が付いている courseId */
export function parseEffectCourseIds(html) {
  const joined = decodeRscChunks(html) + html;
  const matches = [...joined.matchAll(/pathname":"\/race\/courses\/(\d+)"/g)];
  const ids = [];
  const seen = new Set();

  for (let i = 0; i < matches.length; i++) {
    const id = Number(matches[i][1]);
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : joined.length;
    const block = joined.slice(start, end);
    if (!/course__effect__/.test(block)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids.sort((a, b) => a - b);
}
