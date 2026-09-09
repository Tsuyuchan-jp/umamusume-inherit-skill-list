/**
 * ハブ接続の判定と対象サポカ集合。
 */
import { allowedSupportIds, hubPreferenceFromSearch } from "../app/js/hub.js";

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

if (failed) process.exit(1);
console.log("test_hub: すべて成功");
