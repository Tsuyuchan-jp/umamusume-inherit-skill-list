/**
 * 育成ウマ娘・サポカ6の選択（sp-calc のピッカー見た目を流用。タイプ絞込のみ）。
 */
import { createCardPicker } from "./cardPicker.js";
import {
  characterImageUrl,
  getSupportTypeStyle,
  shortCharacterLabel,
  shortSupportLabel,
  supportImageUrl,
} from "./cardAssets.js";
import { buildCharacterNameSearchText, normalizeSearchText } from "./searchText.js";
import { escapeHtml } from "./htmlEscape.js";

const SUPPORT_TYPE_LABELS = {
  speed: "スピード",
  stamina: "スタミナ",
  power: "パワー",
  guts: "根性",
  wit: "賢さ",
  friend: "友人",
};

export function createDeckUi(deps) {
  const {
    getState,
    getCharacterById,
    getSupportById,
    getAllowedSupportIdSet,
    scheduleSessionSave,
    recalc,
  } = deps;

  let cardPicker = null;
  let supportPickerTypeFilter = "";

  function formatCharacterDisplayName(name) {
    const m = String(name).match(/^\[([^\]]+)\](.+)$/);
    if (!m) return name;
    return `${m[2]}[${m[1]}]`;
  }

  function buildCardFaceHtml({
    imageUrl,
    typeStyle,
    rarity,
    label,
    empty = false,
    showTextOverlay = false,
    square = false,
  }) {
    const faceClass = square ? "card-face card-face--square" : "card-face";
    if (empty) {
      return `<div class="${faceClass} card-face--empty" aria-hidden="true">＋</div>`;
    }
    const safeLabel = escapeHtml(label);
    const safeRarity = escapeHtml(rarity || "");
    const typeLabel = escapeHtml(typeStyle?.label || "");
    const overlayHtml = showTextOverlay
      ? `${safeRarity ? `<span class="card-face__rarity">${safeRarity}</span>` : ""}
      <span class="card-face__label">${safeLabel}</span>`
      : "";
    return `
    <div class="${faceClass}" style="--card-bg:${typeStyle?.bg || "#e8e8e8"};--card-ink:${typeStyle?.ink || "#1c2420"}">
      <img class="card-face__img" src="${escapeHtml(imageUrl)}" alt=""
        onload="this.classList.add('is-loaded');this.nextElementSibling?.setAttribute('hidden','');"
        onerror="this.classList.add('is-failed');this.nextElementSibling?.removeAttribute('hidden');" />
      <div class="card-face__ph" hidden>
        <span class="card-face__ph-type">${typeLabel}</span>
        <span>${safeLabel}</span>
      </div>
      ${overlayHtml}
    </div>
  `;
  }

  function supportSearchHaystack(s) {
    return normalizeSearchText(
      [s.name, s.title, s.characterName, s.rarity, SUPPORT_TYPE_LABELS[s.type] || s.type, s.type]
        .filter(Boolean)
        .join(" ")
    );
  }

  function renderDeckCharacter() {
    const state = getState();
    const btn = document.getElementById("deck-character");
    if (!btn || !state) return;
    const c = getCharacterById(state.ui.characterId);
    if (!c) {
      btn.innerHTML = `${buildCardFaceHtml({ empty: true, square: true })}
      <span class="deck-trainee-meta">
        <span class="deck-trainee-meta__lbl">育成</span>
        <span class="deck-trainee-meta__name">未選択</span>
      </span>`;
      return;
    }
    const label = formatCharacterDisplayName(c.name);
    const short = shortCharacterLabel(c.name);
    btn.innerHTML = `${buildCardFaceHtml({
      imageUrl: characterImageUrl(c.id),
      typeStyle: { bg: "linear-gradient(160deg,#d4dce4,#8a9aaa)", ink: "#1c2420", label: "ウマ" },
      rarity: "",
      label: short,
      square: true,
      showTextOverlay: false,
    })}
    <span class="deck-trainee-meta">
      <span class="deck-trainee-meta__lbl">育成</span>
      <span class="deck-trainee-meta__name">${escapeHtml(short)}</span>
    </span>`;
    btn.title = label;
  }

  function renderDeckSupports() {
    const state = getState();
    const container = document.getElementById("deck-supports");
    if (!container || !state) return;
    container.innerHTML = "";
    for (let i = 0; i < 6; i++) {
      const col = document.createElement("div");
      col.className = "deck-support-col";
      col.dataset.slot = String(i);

      const id = state.ui.supportIds[i];
      const s = id != null ? getSupportById(id) : null;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "deck-slot";
      btn.dataset.slot = String(i);
      btn.setAttribute("aria-label", `枠${i + 1}を選択`);
      const badge = `<span class="deck-slot-badge" aria-hidden="true">${i + 1}</span>`;
      if (!s) {
        btn.innerHTML = badge + buildCardFaceHtml({ empty: true });
      } else {
        const typeStyle = getSupportTypeStyle(s.type);
        btn.innerHTML =
          badge +
          buildCardFaceHtml({
            imageUrl: supportImageUrl(s.id),
            typeStyle,
            rarity: s.rarity,
            label: shortSupportLabel(s),
            showTextOverlay: false,
          });
        btn.title = s.name;
      }
      btn.addEventListener("click", () => openSupportPicker(i));
      col.appendChild(btn);
      container.appendChild(col);
    }
  }

  function buildCharacterPickerItems() {
    const state = getState();
    return [...state.characters]
      .map((c) => ({
        id: c.id,
        label: formatCharacterDisplayName(c.name),
        searchText: buildCharacterNameSearchText(c.name),
        html: buildCardFaceHtml({
          imageUrl: characterImageUrl(c.id),
          typeStyle: { bg: "linear-gradient(160deg,#d4dce4,#8a9aaa)", ink: "#1c2420", label: "ウマ" },
          rarity: "",
          label: shortCharacterLabel(c.name),
          square: true,
          showTextOverlay: false,
        }),
      }))
      .sort((a, b) => a.searchText.localeCompare(b.searchText, "ja"));
  }

  function buildSupportPickerItems(slotIndex) {
    const state = getState();
    const occupied = new Set(
      state.ui.supportIds.filter((id, idx) => id != null && idx !== slotIndex)
    );
    const allowed = getAllowedSupportIdSet();
    const q = "";

    return [...state.supports]
      .filter((s) => allowed.has(s.id))
      .filter((s) => !occupied.has(s.id) || s.id === state.ui.supportIds[slotIndex])
      .filter((s) => !supportPickerTypeFilter || s.type === supportPickerTypeFilter)
      .filter((s) => !q || supportSearchHaystack(s).includes(q))
      .sort((a, b) => b.id - a.id)
      .map((s) => {
        const typeStyle = getSupportTypeStyle(s.type);
        return {
          id: s.id,
          label: s.characterName || s.name,
          searchText: buildCharacterNameSearchText(s.characterName || s.name),
          html: buildCardFaceHtml({
            imageUrl: supportImageUrl(s.id),
            typeStyle,
            rarity: s.rarity,
            label: shortSupportLabel(s),
            showTextOverlay: false,
          }),
        };
      });
  }

  function renderPickerTypeChips() {
    const container = document.getElementById("card-picker-type-chips");
    if (!container) return;
    const types = [
      { value: "", label: "すべて" },
      { value: "speed", label: "スピ" },
      { value: "stamina", label: "スタ" },
      { value: "power", label: "パワ" },
      { value: "guts", label: "根性" },
      { value: "wit", label: "賢さ" },
      { value: "friend", label: "友人" },
    ];
    container.innerHTML = types
      .map(({ value, label }) => {
        const active = supportPickerTypeFilter === value;
        const dot = value
          ? `<span class="type-chip__dot type-chip__dot--${escapeHtml(value)}" aria-hidden="true"></span>`
          : "";
        return `<button type="button" class="type-chip${active ? " is-active" : ""}" data-type="${escapeHtml(value)}" aria-pressed="${active ? "true" : "false"}">${dot}${escapeHtml(label)}</button>`;
      })
      .join("");
  }

  function openCharacterPicker() {
    const state = getState();
    if (!cardPicker || !state) return;
    const c = getCharacterById(state.ui.characterId);
    cardPicker.open({
      title: "育成ウマ娘を選択",
      mode: "character",
      previewImageUrl: c ? characterImageUrl(c.id) : "",
      previewLabel: c ? formatCharacterDisplayName(c.name) : "未選択",
      items: buildCharacterPickerItems(),
      selectedId: state.ui.characterId,
      allowClear: false,
      onPick: (id) => {
        if (id == null) return;
        state.ui.characterId = id;
        renderDeckCharacter();
        scheduleSessionSave();
        recalc();
      },
    });
  }

  function openSupportPicker(slotIndex) {
    const state = getState();
    if (!cardPicker || !state) return;
    renderPickerTypeChips();
    const s = getSupportById(state.ui.supportIds[slotIndex]);
    cardPicker.open({
      title: `サポートカード 枠${slotIndex + 1}`,
      mode: "support",
      previewImageUrl: s ? supportImageUrl(s.id) : "",
      previewLabel: s ? s.characterName || s.name : "未選択",
      getItems: () => buildSupportPickerItems(slotIndex),
      selectedId: state.ui.supportIds[slotIndex],
      allowClear: true,
      showSupportFilters: true,
      onFiltersChange: () => {
        const active = document.querySelector("#card-picker-type-chips .type-chip.is-active");
        supportPickerTypeFilter = active?.dataset?.type ?? "";
      },
      onPick: (id) => {
        state.ui.supportIds[slotIndex] = id;
        renderDeckSupports();
        scheduleSessionSave();
        recalc();
      },
    });
  }

  function bind() {
    cardPicker = createCardPicker({
      dialog: document.getElementById("card-picker"),
      titleEl: document.getElementById("card-picker-title"),
      previewThumbEl: document.getElementById("card-picker-preview-thumb"),
      previewNameEl: document.getElementById("card-picker-preview-name"),
      searchEl: document.getElementById("card-picker-search"),
      gridEl: document.getElementById("card-picker-grid"),
      closeBtn: document.getElementById("card-picker-close"),
      clearBtn: document.getElementById("card-picker-clear"),
      filtersEl: document.getElementById("card-picker-filters"),
    });
    document.getElementById("deck-character")?.addEventListener("click", openCharacterPicker);
    renderPickerTypeChips();
  }

  return {
    bind,
    renderDeckDashboard() {
      renderDeckCharacter();
      renderDeckSupports();
    },
  };
}
