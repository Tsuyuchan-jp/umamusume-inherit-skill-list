/**
 * U-tools 白∩共通リストから、本育成で取れるチェーンを除いた継承候補。
 */
import { getChainRoot, isChainMember } from "./goldLower.js";

export const COPY_LIMIT = 25;

/**
 * 取れるスキルがチェーン上にあれば、○/◎/金までまとめて除外する。
 * @param {Iterable<number>} ids
 * @param {Map<number, object>} skillById
 * @returns {Set<number>}
 */
export function expandObtainedChainIds(ids, skillById) {
  const out = new Set();
  for (const id of ids) {
    const skill = skillById.get(Number(id));
    if (!skill) {
      out.add(Number(id));
      continue;
    }
    const root = getChainRoot(skill, skillById);
    let cur = root;
    const seen = new Set();
    while (cur && isChainMember(cur)) {
      if (seen.has(cur.id)) break;
      seen.add(cur.id);
      out.add(cur.id);
      if (cur.upperSkillId == null) break;
      const up = skillById.get(cur.upperSkillId);
      if (!up || !isChainMember(up)) break;
      cur = up;
    }
  }
  return out;
}

/**
 * @param {object} params
 * @param {{ id: number, name: string, expectedEffect: number }[]} params.rankedWhiteCommon
 * @param {Set<number>} params.obtainableIds
 * @param {Map<number, object>} params.skillById
 * @param {number} [params.limit]
 */
export function buildInheritSkillList({
  rankedWhiteCommon,
  obtainableIds,
  skillById,
  limit = COPY_LIMIT,
}) {
  const excluded = expandObtainedChainIds(obtainableIds, skillById);
  const remaining = rankedWhiteCommon.filter((row) => !excluded.has(row.id));
  return {
    remaining,
    top: remaining.slice(0, limit),
    excludedCount: rankedWhiteCommon.length - remaining.length,
  };
}

export function formatSkillLines(rows) {
  return rows.map((row) => row.name).join("\n");
}
