import {
  filterWhiteCommon,
  isWhiteCommonSkill,
  parseRankedSkillsFromHtml,
} from "./parse_utools_effects.mjs";

/** RSC チャンク1本分の HTML（decodeRscChunks が読む形） */
function htmlWithRsc(inner) {
  const escaped = inner.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `self.__next_f.push([1,"${escaped}"])`;
}

const uniqueId = { id: 900001, rarity: 1, characterCardId: null, skillCategory: 0 };
const inheritWhite = { id: 30001, rarity: 1, characterCardId: 100101, skillCategory: 0 };
const gold = { id: 201010, rarity: 2, characterCardId: null, skillCategory: 0 };
const cat5 = { id: 201011, rarity: 1, characterCardId: null, skillCategory: 5 };
const scenario = { id: 210001, rarity: 1, characterCardId: null, skillCategory: 0 };
const commonWhite = { id: 201001, rarity: 1, characterCardId: null, skillCategory: 0 };

if (isWhiteCommonSkill(uniqueId)) throw new Error("unique 90xxxx should drop");
if (isWhiteCommonSkill(inheritWhite)) throw new Error("inherit unique should drop");
if (isWhiteCommonSkill(gold)) throw new Error("gold should drop");
if (isWhiteCommonSkill(cat5)) throw new Error("skillCategory 5 should drop");
if (isWhiteCommonSkill(scenario)) throw new Error("scenario 21xxxx should drop");
if (!isWhiteCommonSkill(commonWhite)) throw new Error("generic white should keep");

const inner = [
  `"id":201001,"rarity":1,"skillCategory":0,"characterCardId":null,"skillName":"左回り○","needSkillPoint":120,"expectedEffect":2.1`,
  `"skillName":"左回り○","skillDesc":"","effectPatterns":[]`,
  `"id":900001,"rarity":1,"skillCategory":0,"characterCardId":null,"skillName":"セイリオス","needSkillPoint":0,"expectedEffect":9.9`,
  `"id":30001,"rarity":1,"skillCategory":0,"characterCardId":100101,"skillName":"継承固有白","needSkillPoint":0,"expectedEffect":3.0`,
  `"id":201010,"rarity":2,"skillCategory":0,"characterCardId":null,"skillName":"直線巧者","needSkillPoint":180,"expectedEffect":4.0`,
  `"id":201011,"rarity":1,"skillCategory":5,"characterCardId":null,"skillName":"カテゴリ5","needSkillPoint":0,"expectedEffect":1.0`,
  `"id":210001,"rarity":1,"skillCategory":0,"characterCardId":null,"skillName":"シナリオ技","needSkillPoint":0,"expectedEffect":1.1`,
  `"id":201004,"rarity":1,"skillCategory":0,"characterCardId":null,"skillName":"余勢を駆って","needSkillPoint":120,"expectedEffect":1.5`,
  `"skillName":"余勢を駆って","skillDesc":"","effectPatterns":[{"effects":[{"target":22}],"conditions":[]}]`,
  `"id":201005,"rarity":1,"skillCategory":0,"characterCardId":null,"skillName":"ワンチャンス","needSkillPoint":160,"expectedEffect":1.4`,
  `"skillName":"ワンチャンス","skillDesc":"","effectPatterns":[{"effects":[{"target":31}],"conditions":[{"order_rate":[{"sign":">=","value":40}]}]}]`,
].join(",");

const ranked = parseRankedSkillsFromHtml(htmlWithRsc(inner));
const whiteCommon = filterWhiteCommon(ranked);
const names = new Set(whiteCommon.map((s) => s.name));

if (names.has("セイリオス")) throw new Error("unique skill leaked into white∩共通");
if (names.has("継承固有白")) throw new Error("inherit unique leaked");
if (names.has("直線巧者") || names.has("カテゴリ5") || names.has("シナリオ技")) {
  throw new Error(`non-common leaked: ${[...names]}`);
}
if (!names.has("左回り○")) throw new Error("expected 左回り○");

const yosei = whiteCommon.find((s) => s.name === "余勢を駆って");
if (!yosei) throw new Error("余勢を駆って missing");
if (yosei.needSkillPoint !== 120) {
  throw new Error(`needSkillPoint ${yosei.needSkillPoint}`);
}
if ((yosei.rateGroups || []).length) {
  throw new Error("余勢 should have no rank cond");
}
const chance = whiteCommon.find((s) => s.name === "ワンチャンス");
if (!chance?.rateGroups?.length) throw new Error("ワンチャンス rank missing");
if (!chance.effectTags.includes("加速")) {
  throw new Error(`ワンチャンス effects ${chance.effectTags}`);
}

console.log(`ok ranked=${ranked.length} whiteCommon=${whiteCommon.length}`);
