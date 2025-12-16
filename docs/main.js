"use strict";

/* ================= CONSTANT ================= */
const MAX_TEAM = 5;
const FALLBACK_IMG =
  "https://via.placeholder.com/300x200?text=No+Image";

/* ================= STATE ================= */
let characters = [];
let cardsData = [];

let team = Array(MAX_TEAM).fill(null);
let teamSubCards = Array(MAX_TEAM).fill(null);

let selectedSlotIndex = null;
let activePopupSlot = null;

/* ================= FILTER STATE ================= */
let activeFilters = {
  position: [],
  element: [],
  class: []
};

/* ================= DOM ================= */
const charsEl = document.getElementById("characters");
const teamEl = document.getElementById("team");
const shareBtn = document.getElementById("shareBtn");
const searchInput = document.getElementById("searchInput");
const filtersBar = document.querySelector(".filters-bar");

/* ================= RESET FILTER ================= */
const resetFilterBtn = document.createElement("button");
resetFilterBtn.id = "resetFilterBtn";
resetFilterBtn.textContent = "RESET FILTER";
resetFilterBtn.style.display = "none";
filtersBar.appendChild(resetFilterBtn);

/* ================= POPUP CARD ================= */
const popup = document.getElementById("cardPopup");
const popupCardsEl = document.getElementById("popupCards");
const popupSearch = document.getElementById("popupSearch");
const popupClose = document.getElementById("closePopup");

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  Promise.all([
    fetch("data/characters.json").then(r => r.json()),
    fetch("data/cards.json").then(r => r.json())
  ]).then(([charData, cardData]) => {
    characters = charData.map(c => ({
      name: c.name,
      element: c.element,
      class: c.class,
      position: c.position,
      image: c.image?.trim() ? c.image : FALLBACK_IMG
    }));

    cardsData = cardData.map(c => ({
      name: c.name,
      image: c.image?.trim() ? c.image : FALLBACK_IMG
    }));

    loadFromURLorStorage();
    setupFilters();
    renderCharacters();
    renderTeam();
  });
});

/* ================= FILTER ================= */
function setupFilters() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.onclick = () => {
      const { type, value } = btn.dataset;

      if (value === "") {
        activeFilters[type] = [];
        document
          .querySelectorAll(`.filter-btn[data-type="${type}"]`)
          .forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      } else {
        document
          .querySelector(
            `.filter-btn[data-type="${type}"][data-value=""]`
          )
          ?.classList.remove("active");

        btn.classList.toggle("active");

        if (btn.classList.contains("active")) {
          if (!activeFilters[type].includes(value))
            activeFilters[type].push(value);
        } else {
          activeFilters[type] = activeFilters[type].filter(
            v => v !== value
          );
        }
      }

      toggleResetButton();
      renderCharacters();
    };
  });

  searchInput.oninput = () => {
    toggleResetButton();
    renderCharacters();
  };
}

function toggleResetButton() {
  resetFilterBtn.style.display =
    activeFilters.position.length ||
    activeFilters.element.length ||
    activeFilters.class.length ||
    searchInput.value.trim()
      ? "block"
      : "none";
}

resetFilterBtn.onclick = () => {
  activeFilters = { position: [], element: [], class: [] };
  searchInput.value = "";

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("active");
    if (btn.dataset.value === "") btn.classList.add("active");
  });

  resetFilterBtn.style.display = "none";
  renderCharacters();
};

/* ================= CHARACTER LIST ================= */
function renderCharacters() {
  charsEl.innerHTML = "";

  characters
    .filter(
      c =>
        (!activeFilters.position.length ||
          activeFilters.position.includes(c.position)) &&
        (!activeFilters.element.length ||
          activeFilters.element.includes(c.element)) &&
        (!activeFilters.class.length ||
          activeFilters.class.includes(c.class)) &&
        c.name
          .toLowerCase()
          .includes(searchInput.value.toLowerCase())
    )
    .forEach(c => {
      const card = document.createElement("div");
      card.className = "card";

      if (team.some(t => t?.name === c.name)) {
        card.classList.add("in-team");
      }

      card.innerHTML = `
        <img src="${c.image}">
        <strong>${c.name}</strong>
        <span>${c.element} • ${c.class} • ${c.position}</span>
      `;

      card.onclick = () => onCharacterClick(c);
      charsEl.appendChild(card);
    });
}

/* ================= CHARACTER CLICK ================= */
function onCharacterClick(character) {
  const existIndex = team.findIndex(
    t => t && t.name === character.name
  );

  if (existIndex !== -1) {
    team[existIndex] = null;
    teamSubCards[existIndex] = null;
    saveAndRender();
    return;
  }

  if (selectedSlotIndex !== null) {
    team[selectedSlotIndex] = character;
    clearSelectedSlot();
    saveAndRender();
    return;
  }

  const emptyIndex = team.findIndex(t => t === null);
  if (emptyIndex === -1) {
    alert("Max 5 characters");
    return;
  }

  team[emptyIndex] = character;
  saveAndRender();
}

/* ================= TEAM ================= */
function renderTeam() {
  teamEl.innerHTML = "";

  for (let i = 0; i < MAX_TEAM; i++) {
    const wrap = document.createElement("div");
    wrap.className = "team-wrap";

    const slot = document.createElement("div");

    if (team[i]) {
      slot.className = "team-card";
      slot.innerHTML = `
        <img src="${team[i].image}">
        <strong>${team[i].name}</strong>
      `;
      slot.onclick = () => {
        team[i] = null;
        teamSubCards[i] = null;
        saveAndRender();
      };
    } else {
      slot.className = "team-slot";
      slot.onclick = () => selectSlot(i, slot);
    }

    const sub = document.createElement("div");
    sub.className = "sub-card";
    sub.onclick = () => openCardPopup(i);

    if (teamSubCards[i]) {
      sub.innerHTML = `
        <img src="${teamSubCards[i].image}">
        <div>${teamSubCards[i].name}</div>
      `;
    } else {
      sub.textContent = "+ Select Card";
    }

    wrap.appendChild(slot);
    wrap.appendChild(sub);
    teamEl.appendChild(wrap);
  }

  renderCharacters();
}

/* ================= SLOT ================= */
function selectSlot(index, el) {
  clearSelectedSlot();
  selectedSlotIndex = index;
  el.classList.add("selected-slot");
}

function clearSelectedSlot() {
  selectedSlotIndex = null;
  document
    .querySelectorAll(".selected-slot")
    .forEach(el => el.classList.remove("selected-slot"));
}

/* ================= POPUP ================= */
function openCardPopup(slotIndex) {
  activePopupSlot = slotIndex;
  popup.classList.remove("hidden");
  popup.classList.add("show");
  popupSearch.value = "";
  renderPopupCards();
}

popupClose.onclick = closePopup;
popup.onclick = e => {
  if (e.target === popup) closePopup();
};

function closePopup() {
  popup.classList.remove("show");
  popup.classList.add("hidden");
  activePopupSlot = null;
}

popupSearch.oninput = renderPopupCards;

function renderPopupCards() {
  popupCardsEl.innerHTML = "";

  cardsData
    .filter(c =>
      c.name
        .toLowerCase()
        .includes(popupSearch.value.toLowerCase())
    )
    .forEach(card => {
      const el = document.createElement("div");
      el.className = "popup-card";
      el.innerHTML = `
        <img src="${card.image}">
        <span>${card.name}</span>
      `;

      el.onclick = () => {
        teamSubCards[activePopupSlot] = card;
        closePopup();
        renderTeam();
      };

      popupCardsEl.appendChild(el);
    });
}

/* ================= STORAGE ================= */
function saveAndRender() {
  persist();
  updateURL();
  renderTeam();
}

function persist() {
  localStorage.setItem("team", JSON.stringify(team));
}

function loadFromURLorStorage() {
  const p = new URLSearchParams(location.search).get("team");
  if (!p) return;

  p.split(",")
    .map(decodeURIComponent)
    .forEach((name, i) => {
      const c = characters.find(x => x.name === name);
      if (c && i < MAX_TEAM) team[i] = c;
    });
}

function updateURL() {
  const names = team
    .filter(Boolean)
    .map(c => encodeURIComponent(c.name))
    .join(",");
  history.replaceState(
    null,
    "",
    names ? "?team=" + names : location.pathname
  );
}

/* ================= SHARE ================= */
shareBtn.onclick = () => {
  navigator.clipboard.writeText(location.href);
  alert("Link copied!");
};
