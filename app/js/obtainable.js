/**
 * 本育成で取れるスキル ID 集合（手軽さ優先）。
 * - サポカ: トレヒント + イベント全選択肢
 * - 育成ウマ娘: 覚醒最大の所持スキル
 * - シナリオ: 自動付与のみ（リンク・ラーメン選択は含めない）
 */

const TRAINING_HINT = 5;
const CHARA_HINT = 3;

function skillNameNormalize(name) {
  return String(name || "").replace(/◯/g, "○").trim();
}

function isEventSupportInDeck(evt, supportIds, supportById) {
  if (!evt.supportNameMatch) return true;
  return supportIds
    .map((id) => supportById.get(id))
    .some((s) => s && s.name.includes(evt.supportNameMatch));
}

function addSkillRef(out, sk, nameToId) {
  const skillId = sk.skillId ?? nameToId.get(skillNameNormalize(sk.skillName));
  if (skillId) out.add(Number(skillId));
}

/**
 * @returns {Set<number>}
 */
export function collectObtainableSkillIds({
  skills,
  supports,
  characters,
  events,
  scenario,
  characterId,
  supportIds,
}) {
  const supportById = new Map(supports.map((s) => [s.id, s]));
  const nameToId = new Map(
    skills.map((s) => [skillNameNormalize(s.name), s.id])
  );
  const out = new Set();

  for (const sid of supportIds || []) {
    const sup = supportById.get(sid);
    if (!sup) continue;
    for (const skillId of sup.hintSkillIds || []) {
      out.add(Number(skillId));
    }
  }

  const chara = characters.find((c) => c.id === characterId);
  if (chara?.skillsByAwakening) {
    for (const skillIds of Object.values(chara.skillsByAwakening)) {
      for (const skillId of skillIds || []) {
        out.add(Number(skillId));
      }
    }
  }

  for (const evt of events.events || []) {
    if (!isEventSupportInDeck(evt, supportIds, supportById)) continue;
    if (evt.skills?.length) {
      for (const sk of evt.skills) addSkillRef(out, sk, nameToId);
    }
    for (const choice of evt.choices || []) {
      for (const sk of choice.skills || []) addSkillRef(out, sk, nameToId);
    }
  }

  for (const entry of scenario.scenarioAutoSkills || []) {
    for (const sk of entry.skills || []) addSkillRef(out, sk, nameToId);
  }

  void TRAINING_HINT;
  void CHARA_HINT;
  return out;
}
