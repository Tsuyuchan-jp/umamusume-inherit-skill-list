import { expandObtainedChainIds, buildInheritSkillList } from "../app/js/inheritList.js";
import { getChainRoot, isChainMember } from "../app/js/goldLower.js";

const skillById = new Map([
  [
    1,
    { id: 1, name: "直線○", rarity: 1, groupRate: 1, lowerSkillId: null, upperSkillId: 2 },
  ],
  [
    2,
    { id: 2, name: "直線◎", rarity: 1, groupRate: 2, lowerSkillId: 1, upperSkillId: 3 },
  ],
  [
    3,
    { id: 3, name: "直線巧者", rarity: 2, groupRate: 3, lowerSkillId: 2, upperSkillId: null },
  ],
  [10, { id: 10, name: "別スキル", rarity: 1, groupRate: 1, lowerSkillId: null, upperSkillId: null }],
]);

const expanded = expandObtainedChainIds([3], skillById);
if (!expanded.has(1) || !expanded.has(2) || !expanded.has(3)) {
  throw new Error(`chain expand failed: ${[...expanded]}`);
}

const ranked = [
  { id: 1, name: "直線○", expectedEffect: 2 },
  { id: 10, name: "別スキル", expectedEffect: 1 },
];
const { top, remaining } = buildInheritSkillList({
  rankedWhiteCommon: ranked,
  obtainableIds: new Set([3]),
  skillById,
  limit: 25,
});
if (remaining.some((r) => r.id === 1)) throw new Error("gold should exclude white");
if (top.length !== 1 || top[0].id !== 10) throw new Error("remaining mismatch");

const ranked2 = [
  { id: 10, name: "別スキル", expectedEffect: 3 },
  { id: 20, name: "手動で外す", expectedEffect: 2 },
  { id: 21, name: "繰り上がり", expectedEffect: 1 },
];
const manual = buildInheritSkillList({
  rankedWhiteCommon: ranked2,
  obtainableIds: new Set(),
  skillById,
  limit: 2,
  manualExcludeIds: new Set([20]),
});
if (manual.top.length !== 2 || manual.top[0].id !== 10 || manual.top[1].id !== 21) {
  throw new Error("manual exclude should promote next skill");
}
if (manual.manualExcludedVisible.length !== 1 || manual.manualExcludedVisible[0].id !== 20) {
  throw new Error("manual excluded should stay in U-tools order");
}
const hiddenManual = buildInheritSkillList({
  rankedWhiteCommon: ranked2,
  obtainableIds: new Set([20]),
  skillById,
  limit: 2,
  manualExcludeIds: new Set([20]),
});
if (hiddenManual.manualExcludedVisible.length !== 0) {
  throw new Error("obtainable skills should hide from 除外中");
}

const root = getChainRoot(skillById.get(3), skillById);
if (!isChainMember(root) || root.id !== 1) throw new Error("root mismatch");

console.log("ok inheritList");
