/**
 * U-tools の effectPatterns から、一覧用の順位・効果・局面・適性タグを作る。
 */

const EFFECT_BY_TARGET = {
  9: "回復",
  21: "回復",
  22: "現在速度",
  27: "速度",
  31: "加速",
};

const STYLE_BY_VALUE = { 1: "逃げ", 2: "先行", 3: "差し", 4: "追込" };
const DIST_BY_VALUE = { 1: "短距離", 2: "マイル", 3: "中距離", 4: "長距離" };
const PHASE_BY_VALUE = { 0: "序盤", 1: "中盤", 2: "終盤" };

const PHASE_KEYS = {
  phase: (v) => PHASE_BY_VALUE[v] || null,
  phase_random: (v) => PHASE_BY_VALUE[v] || null,
  phase_firsthalf: (v) => (PHASE_BY_VALUE[v] ? `${PHASE_BY_VALUE[v]}前半` : null),
  phase_laterhalf: (v) => (PHASE_BY_VALUE[v] ? `${PHASE_BY_VALUE[v]}後半` : null),
  phase_firsthalf_random: (v) => (PHASE_BY_VALUE[v] ? `${PHASE_BY_VALUE[v]}前半` : null),
  phase_laterhalf_random: (v) => (PHASE_BY_VALUE[v] ? `${PHASE_BY_VALUE[v]}後半` : null),
  phase_corner_random: () => "コーナー",
  is_last_straight: () => "最終直線",
  is_last_straight_onetime: () => "最終直線",
  is_lastspurt: () => "ラストスパート",
  is_finalcorner_laterhalf: () => "最終コーナー後半",
  up_slope_random: () => "上り坂",
  down_slope_random: () => "下り坂",
  all_corner_random: () => "コーナー",
  straight_random: () => "直線",
  corner: () => "コーナー",
};

function condValues(entry) {
  if (!Array.isArray(entry)) return [];
  return entry.map((x) => ({ sign: x.sign, value: String(x.value) }));
}

function uniquePush(arr, v) {
  if (v && !arr.includes(v)) arr.push(v);
}

/**
 * @param {object[]} patterns
 */
export function summarizePatterns(patterns) {
  const effectTags = [];
  const phaseTags = [];
  const aptTags = [];
  const rateGroups = [];
  if (!Array.isArray(patterns)) {
    return { effectTags, phaseTags, aptTags, rateGroups };
  }
  for (const pat of patterns) {
    for (const fx of pat.effects || []) {
      uniquePush(effectTags, EFFECT_BY_TARGET[fx.target]);
    }
    for (const group of pat.conditions || []) {
      const rank = [];
      for (const r of condValues(group.order_rate)) {
        rank.push({ kind: "rate", sign: r.sign, value: Number(r.value) });
      }
      for (const r of condValues(group.order)) {
        rank.push({ kind: "order", sign: r.sign, value: Number(r.value) });
      }
      if (rank.length) rateGroups.push(rank);

      for (const r of condValues(group.running_style)) {
        uniquePush(aptTags, STYLE_BY_VALUE[r.value]);
      }
      for (const r of condValues(group.distance_type)) {
        uniquePush(aptTags, DIST_BY_VALUE[r.value]);
      }
      for (const [key, fn] of Object.entries(PHASE_KEYS)) {
        if (!group[key]) continue;
        for (const r of condValues(group[key])) {
          uniquePush(phaseTags, fn(r.value));
        }
      }
    }
  }
  return { effectTags, phaseTags, aptTags, rateGroups };
}

function rateOk(rate, sign, value) {
  if (sign === ">=" || sign === "\u003e=") return rate >= value;
  if (sign === "<=" || sign === "\u003c=") return rate <= value;
  if (sign === ">" || sign === "\u003e") return rate > value;
  if (sign === "<" || sign === "\u003c") return rate < value;
  if (sign === "==") return rate === value;
  return true;
}

function orderOk(order, sign, value) {
  if (sign === ">=" || sign === "\u003e=") return order >= value;
  if (sign === "<=" || sign === "\u003c=") return order <= value;
  if (sign === ">" || sign === "\u003e") return order > value;
  if (sign === "<" || sign === "\u003c") return order < value;
  if (sign === "==") return order === value;
  return true;
}

/**
 * チャンミ9 / リグヒ12。グループは OR、グループ内は AND。
 * 順位条件が無いスキルは null。
 */
export function activeOrders(n, rateGroups) {
  if (!rateGroups?.length) return null;
  const set = new Set();
  for (let order = 1; order <= n; order++) {
    const rate = (100 * order) / n;
    const hit = rateGroups.some((group) =>
      group.every((c) =>
        c.kind === "order"
          ? orderOk(order, c.sign, c.value)
          : rateOk(rate, c.sign, c.value)
      )
    );
    if (hit) set.add(order);
  }
  if (set.size === 0 || set.size === n) return null;
  return [...set].sort((a, b) => a - b);
}

/** @returns {{ label: string, kind: string } | null} */
export function rankBadge(orders, n) {
  if (!orders?.length) return null;
  const min = Math.min(...orders);
  const max = Math.max(...orders);
  const frontMax = n === 12 ? 6 : 4;
  if (min === 1 && max <= frontMax) return { label: "前", kind: "front" };
  const backMin = n === 12 ? 5 : 4;
  if (min >= backMin) return { label: "中後", kind: "back" };
  return { label: "その他", kind: "other" };
}
