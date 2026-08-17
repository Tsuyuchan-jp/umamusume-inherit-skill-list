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
 * @param {Set<number>} [params.manualExcludeIds] 手動除外（チェーン展開しない）
 */
export function buildInheritSkillList({
  rankedWhiteCommon,
  obtainableIds,
  skillById,
  limit = COPY_LIMIT,
  manualExcludeIds = new Set(),
}) {
  const autoExcluded = expandObtainedChainIds(obtainableIds, skillById);
  const afterAuto = rankedWhiteCommon.filter((row) => !autoExcluded.has(row.id));
  const remaining = afterAuto.filter((row) => !manualExcludeIds.has(row.id));
  // 有効順のまま。本育成で取れなくなった／リストに無い ID は出さない
  const manualExcludedVisible = afterAuto.filter((row) =>
    manualExcludeIds.has(row.id)
  );
  return {
    remaining,
    top: remaining.slice(0, limit),
    excludedCount: rankedWhiteCommon.length - remaining.length,
    manualExcludedVisible,
  };
}

export function formatSkillLines(rows) {
  return rows.map((row) => row.name).join("\n");
}

/** U-tools と同じく 100Pt あたりの獲得バ身 */
export function ptEfficiencyPer100(expectedEffect, needSkillPoint) {
  const pt = Number(needSkillPoint);
  if (!Number.isFinite(expectedEffect) || !Number.isFinite(pt) || pt <= 0) {
    return null;
  }
  return (expectedEffect / pt) * 100;
}

export function formatEffectStats(row) {
  const basha =
    row.expectedEffect == null || !Number.isFinite(Number(row.expectedEffect))
      ? "—"
      : `${Number(row.expectedEffect).toFixed(2)}バ`;
  const per = ptEfficiencyPer100(row.expectedEffect, row.needSkillPoint);
  const perPt = per == null ? "—" : `${per.toFixed(2)}バ/Pt`;
  return { basha, perPt };
}
