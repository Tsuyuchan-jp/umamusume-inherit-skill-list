/**
 * ハブ接続の判定と対象サポカ集合。
 * 隣に umamusume-data があれば、棚の実ファイルでも件数を確認する。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  allowedSupportIds,
  effectsFileRel,
  hubFileUrl,
  hubPreferenceFromSearch,
} from "../app/js/hub.js";

let failed = 0;
function check(name, ok, detail = "") {
  if (ok) console.log(`ok  ${name}`);
  else {
    failed += 1;
    console.error(`NG  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

check("?hub=local → local", hubPreferenceFromSearch("?hub=local") === "local");
check("?hub=0 → local", hubPreferenceFromSearch("hub=0") === "local");
check("?hub=remote → remote", hubPreferenceFromSearch("?hub=remote") === "remote");
check("空は auto", hubPreferenceFromSearch("") === "auto");

const supports = [{ id: 1 }, { id: 2 }, { id: 3 }];
const events = { prioritySupportIds: [2, 3, 9] };
const allowed = allowedSupportIds(supports, events);
check("events ∩ supports", allowed.size === 2 && allowed.has(2) && allowed.has(3) && !allowed.has(9));

const hubFiltered = allowedSupportIds([{ id: 2 }, { id: 3 }], events);
check("ハブの対象分だけでも events で絞る", hubFiltered.size === 2);

check(
  "hubFileUrl に版クエリ",
  hubFileUrl("https://example.test/hub/", "data/skills.json", "0.1.1") ===
    "https://example.test/hub/data/skills.json?v=0.1.1"
);
check(
  "effectsFileRel の遅延パス",
  effectsFileRel({ path: "data/effects/" }, 10606, "leader") ===
    "data/effects/10606/leader.json"
);

const hubDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../umamusume-data");
const manifestPath = path.join(hubDir, "manifest.json");
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const supportsPath = path.join(hubDir, manifest.files.supports.path);
  const eventsPath = path.join(hubDir, manifest.files.events.path);
  const hubSupports = JSON.parse(fs.readFileSync(supportsPath, "utf8"));
  const hubEvents = JSON.parse(fs.readFileSync(eventsPath, "utf8"));
  const ids = allowedSupportIds(hubSupports, hubEvents);
  const expected = Number(manifest.files.supports.count);
  check(
    "棚の supports 件数と対象集合が一致",
    ids.size === expected && expected > 0,
    `ids=${ids.size} count=${expected}`
  );
  const coursesMeta = manifest.files.courses;
  if (coursesMeta?.path) {
    const coursesPath = path.join(hubDir, coursesMeta.path);
    const coursesDoc = JSON.parse(fs.readFileSync(coursesPath, "utf8"));
    const n = Array.isArray(coursesDoc.courses) ? coursesDoc.courses.length : 0;
    check(
      "棚の courses 件数",
      n > 0 && n === Number(coursesMeta.count || n),
      `n=${n} count=${coursesMeta.count}`
    );
  } else {
    check("棚の files.courses", false, "manifest に courses がありません");
  }
  const effectsMeta = manifest.files.effects;
  if (effectsMeta?.path || effectsMeta?.index) {
    const indexRel = effectsMeta.index || `${String(effectsMeta.path).replace(/\/?$/, "/")}available.json`;
    const indexPath = path.join(hubDir, indexRel);
    if (!fs.existsSync(indexPath)) {
      check("棚の effects index", false, indexRel);
    } else {
      const available = JSON.parse(fs.readFileSync(indexPath, "utf8"));
      const n = Array.isArray(available.courseIds) ? available.courseIds.length : 0;
      const sampleId = available.courseIds?.[0];
      const sampleFile =
        sampleId != null
          ? path.join(hubDir, effectsFileRel(effectsMeta, sampleId, "leader"))
          : null;
      check(
        "棚の effects 件数",
        n > 0 && n === Number(effectsMeta.courseCount || n),
        `n=${n} count=${effectsMeta.courseCount}`
      );
      check(
        "棚の effects は1コース1ファイル",
        sampleFile ? fs.existsSync(sampleFile) : false,
        sampleFile || "sample missing"
      );
    }
  } else {
    check("棚の files.effects", false, "manifest に effects がありません");
  }
} else {
  console.log("skip 隣の umamusume-data が無いため棚ファイル検証は省略");
}

if (failed) process.exit(1);
console.log("test_hub: すべて成功");
