/** 購入チェーンに含めるスキルか（group_rate < 0 の×等は除外） */
export function isChainMember(skill) {
  return skill != null && (skill.groupRate == null || skill.groupRate >= 0);
}

/**
 * グループ内の購入チェーン上の最下位まで辿る
 * @param {object} skill
 * @param {Map<number, object>} skillById
 */
export function getChainRoot(skill, skillById) {
  let cur = skill;
  const seen = new Set();
  while (cur?.lowerSkillId != null) {
    if (seen.has(cur.id)) break;
    seen.add(cur.id);
    const lower = skillById.get(cur.lowerSkillId);
    if (!isChainMember(lower)) break;
    cur = lower;
  }
  return cur;
}
