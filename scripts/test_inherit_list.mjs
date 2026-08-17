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

const root = getChainRoot(skillById.get(3), skillById);
if (!isChainMember(root) || root.id !== 1) throw new Error("root mismatch");

console.log("ok inheritList");
