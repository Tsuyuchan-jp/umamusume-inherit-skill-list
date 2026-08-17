import { createDeckUi } from "./deckUi.js";
import { collectObtainableSkillIds } from "./obtainable.js";
import {
  COPY_LIMIT,
  buildInheritSkillList,
  formatSkillLines,
} from "./inheritList.js";
import { copyTextToClipboard } from "./clipboard.js";
import { escapeHtml } from "./htmlEscape.js";

const DATA_BASE = new URL("../../data/", import.meta.url);
const SESSION_KEY = "umamusume-inherit-skill-list-v1";
const UTOOLS_ORIGIN = "https://xn--gck1f423k.xn--1bvt37a.tools";
const STYLE_LABELS = {
  runner: "逃げ",
  leader: "先行",
  betweener: "差し",
  chaser: "追込",
};

const state = {
  skills: [],
  supports: [],
  characters: [],
  events: { events: [] },
  scenario: {},
  courses: [],
  priorityIds: new Set(),
  effects: null,
  ui: {
    courseId: 10606,
    style: "leader",
    characterId: 100101,
    supportIds: [null, null, null, null, null, null],
  },
};

let deckUi = null;
let saveTimer = null;
let lastResult = null;

function dataUrl(name) {
  return new URL(name, DATA_BASE).href;
}

async function loadJson(name) {
  const res = await fetch(dataUrl(name));
  if (!res.ok) throw new Error(`${name} HTTP ${res.status}`);
  return res.json();
}

function getCharacterById(id) {
  return state.characters.find((c) => c.id === id);
}

function getSupportById(id) {
  return state.supports.find((s) => s.id === id);
}

function scheduleSessionSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(state.ui));
    } catch {
      /* ignore */
    }
  }, 200);
}

function restoreSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.courseId) state.ui.courseId = Number(saved.courseId);
    if (saved.style) state.ui.style = saved.style;
    if (saved.characterId) state.ui.characterId = Number(saved.characterId);
    if (Array.isArray(saved.supportIds) && saved.supportIds.length === 6) {
      state.ui.supportIds = saved.supportIds.map((id) =>
        id == null ? null : Number(id)
      );
    }
  } catch {
    /* ignore */
  }
}

function fillCourseSelect() {
  const sel = document.getElementById("course-select");
  if (!sel) return;
  sel.innerHTML = state.courses
    .map((c) => {
      const label = c.name || `コース ${c.id}`;
      return `<option value="${c.id}">${escapeHtml(label)}</option>`;
    })
    .join("");
  if (![...sel.options].some((o) => Number(o.value) === state.ui.courseId)) {
    if (state.courses[0]) state.ui.courseId = state.courses[0].id;
  }
  sel.value = String(state.ui.courseId);
}

function syncStyleButtons() {
  document.querySelectorAll("[data-style]").forEach((btn) => {
    const on = btn.dataset.style === state.ui.style;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function utoolsEffectsUrl(courseId, style) {
  return `${UTOOLS_ORIGIN}/race/courses/${courseId}/effects/${style}`;
}

function syncUtoolsLink() {
  const a = document.getElementById("utools-link");
  if (!a) return;
  const style = STYLE_LABELS[state.ui.style] ? state.ui.style : "leader";
  a.href = utoolsEffectsUrl(state.ui.courseId, style);
  const styleLabel = STYLE_LABELS[style] || style;
  a.textContent = `U-tools の有効スキルを開く（${styleLabel}）`;
}

async function loadEffects() {
  const { courseId, style } = state.ui;
  const res = await fetch(dataUrl(`effects/${courseId}/${style}.json`));
  if (!res.ok) {
    state.effects = null;
    return;
  }
  state.effects = await res.json();
}

function recalc() {
  const listEl = document.getElementById("result-list");
  const metaEl = document.getElementById("result-meta");
  const copyBtn = document.getElementById("copy-top");
  if (!listEl) return;

  if (!state.effects?.skills) {
    lastResult = null;
    listEl.innerHTML =
      "<li class=\"result-empty\">このコース・脚質の有効スキルデータがまだありません。<code>npm run extract:effects -- --course " +
      state.ui.courseId +
      "</code> を実行してください。</li>";
    if (metaEl) metaEl.textContent = "データなし";
    if (copyBtn) copyBtn.disabled = true;
    return;
  }

  const skillById = new Map(state.skills.map((s) => [s.id, s]));
  const obtainableIds = collectObtainableSkillIds({
    skills: state.skills,
    supports: state.supports,
    characters: state.characters,
    events: state.events,
    scenario: state.scenario,
    characterId: state.ui.characterId,
    supportIds: state.ui.supportIds,
  });
  const result = buildInheritSkillList({
    rankedWhiteCommon: state.effects.skills,
    obtainableIds,
    skillById,
    limit: COPY_LIMIT,
  });
  lastResult = result;

  if (!result.top.length) {
    listEl.innerHTML = '<li class="result-empty">先頭25件に残るスキルはありません。</li>';
  } else {
    listEl.innerHTML = result.top
      .map(
        (row, i) =>
          `<li><span class="result-rank">${i + 1}</span><span class="result-name">${escapeHtml(row.name)}</span></li>`
      )
      .join("");
  }

  const styleLabel = STYLE_LABELS[state.ui.style] || state.ui.style;
  if (metaEl) {
    metaEl.textContent = `白∩共通 ${state.effects.whiteCommonCount ?? state.effects.skills.length}件 → 除外後 ${result.remaining.length}件 / 表示 ${result.top.length}件（${styleLabel}）`;
  }
  if (copyBtn) copyBtn.disabled = result.top.length === 0;
}

async function onCourseOrStyleChange() {
  syncUtoolsLink();
  await loadEffects();
  recalc();
  scheduleSessionSave();
}

function bind() {
  document.getElementById("course-select")?.addEventListener("change", async (e) => {
    state.ui.courseId = Number(e.target.value);
    await onCourseOrStyleChange();
  });
  document.querySelectorAll("[data-style]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      state.ui.style = btn.dataset.style;
      syncStyleButtons();
      await onCourseOrStyleChange();
    });
  });
  const copyBtn = document.getElementById("copy-top");
  copyBtn?.addEventListener("click", async () => {
    if (!lastResult?.top?.length) return;
    const ok = await copyTextToClipboard(formatSkillLines(lastResult.top));
    copyBtn.textContent = ok ? "コピーしました" : "コピー失敗";
    setTimeout(() => {
      copyBtn.textContent = `先頭${COPY_LIMIT}件をコピー`;
    }, 1600);
  });
  document.getElementById("open-db")?.addEventListener("click", () => {
    window.open("https://uma.pure-db.com/ja-jp/advanced-search", "_blank", "noopener");
  });
}

async function init() {
  restoreSession();
  const [skills, supports, characters, events, scenario, priority, coursesDoc] =
    await Promise.all([
      loadJson("skills.json"),
      loadJson("supports.json"),
      loadJson("characters.json"),
      loadJson("events.json"),
      loadJson("scenarios/toresenken.json"),
      loadJson("priority-supports.json"),
      loadJson("courses.json").catch(() => ({ courses: [{ id: 10606, name: "東京 2400m（芝）" }] })),
    ]);
  state.skills = skills;
  state.supports = supports;
  state.characters = characters;
  state.events = events;
  state.scenario = scenario;
  state.priorityIds = new Set((priority.supports || []).map((s) => s.id));
  state.courses = coursesDoc.courses?.length
    ? coursesDoc.courses
    : [{ id: 10606, name: "東京 2400m（芝）" }];

  fillCourseSelect();
  syncStyleButtons();
  syncUtoolsLink();
  bind();

  deckUi = createDeckUi({
    getState: () => state,
    getCharacterById,
    getSupportById,
    getAllowedSupportIdSet: () => state.priorityIds,
    scheduleSessionSave,
    recalc,
  });
  deckUi.bind();
  deckUi.renderDeckDashboard();
  await loadEffects();
  recalc();
}

init().catch((err) => {
  const listEl = document.getElementById("result-list");
  if (listEl) {
    listEl.innerHTML = `<li class="result-empty">${escapeHtml(err.message || String(err))}</li>`;
  }
  console.error(err);
});
