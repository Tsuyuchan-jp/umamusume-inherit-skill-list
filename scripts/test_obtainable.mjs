import { collectObtainableSkillIds } from "../app/js/obtainable.js";

const skills = [
  { id: 1, name: "ヒント白" },
  { id: 2, name: "イベント白" },
  { id: 3, name: "覚醒白" },
  { id: 4, name: "自動付与" },
  { id: 5, name: "リンク技" },
  { id: 6, name: "ラーメン技" },
  { id: 7, name: "他サポカイベント" },
];

const supports = [
  { id: 10, name: "[タイトル]テストサポカ", hintSkillIds: [1] },
  { id: 20, name: "[別]別サポカ", hintSkillIds: [99] },
];

const characters = [
  { id: 100, skillsByAwakening: { 1: [3], 5: [3] } },
];

const events = {
  events: [
    {
      supportNameMatch: "タイトル",
      skills: [{ skillId: 2 }],
      choices: [{ skills: [{ skillName: "イベント白" }] }],
    },
    {
      supportNameMatch: "別",
      choices: [{ skills: [{ skillId: 7 }] }],
    },
  ],
};

const scenario = {
  scenarioAutoSkills: [{ skills: [{ skillId: 4 }] }],
  linkSkills: [{ skillWithLink: { skillId: 5 } }],
  seniorRmjChoice: { choices: [{ skills: [{ skillId: 6 }] }] },
};

const ids = collectObtainableSkillIds({
  skills,
  supports,
  characters,
  events,
  scenario,
  characterId: 100,
  supportIds: [10],
});

for (const want of [1, 2, 3, 4]) {
  if (!ids.has(want)) throw new Error(`missing obtainable ${want}`);
}
for (const drop of [5, 6, 7, 99]) {
  if (ids.has(drop)) throw new Error(`should not count ${drop}`);
}

console.log("ok obtainable");
