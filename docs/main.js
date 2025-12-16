"use strict";

/* ================= CONSTANT ================= */
const MAX_TEAM = 5;
const FALLBACK_IMG =
  "https://via.placeholder.com/300x200?text=No+Image";

/* ================= STATE ================= */
let activeCardSlotIndex = null;

let cards = [];
let cardSlots = Array(MAX_TEAM).fill(null);

let characters = [];
let team = Array(MAX_TEAM).fill(null);
let selectedSlotIndex = null;

let activeFilters = {
  position: [],
  element: [],
  class: []
};

/* ================= DOM ================= */
const cardPopup = document.getElementById("cardPopup");
const closeCardPopupBtn = document.getElementById("closeCardPopup");

const cardListEl = document.getElementById("cardList");
const cardSearchInput = document.getElementById("cardSearchInput");
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

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  /* ===== FETCH CHARACTERS (EXISTING) ===== */
  fetch("data/characters.json")
    .then(r => r.json())
    .then(data => {
      characters = data.map(c => ({
        name: c.name,
        element: c.element,
        class: c.class,
        position: c.position,
        image: c.image?.trim() ? c.image : FALLBACK_IMG
      }));

      loadFromURLorStorage();
      setupFilters();
      renderCharacters();
      renderTeam();
    });

  /* ===== FETCH CARDS (NEW) ===== */
  fetch("data/cards.json")
  .then(r => r.json())
  .then(data => {
    cards = data.map(c => ({
      id: c.id,
      name: c.name,
      image: c.img?.trim() ? c.img : FALLBACK_IMG
    }));
    loadCardsFromStorage();
    renderTeam();
    renderCardList();
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
          .querySelector(`.filter-btn[data-type="${type}"][data-value=""]`)
          ?.classList.remove("active");

        btn.classList.toggle("active");

        if (btn.classList.contains("active")) {
          activeFilters[type].push(value);
        } else {
          activeFilters[type] =
            activeFilters[type].filter(v => v !== value);
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
    .filter(c =>
      (!activeFilters.position.length ||
        activeFilters.position.includes(c.position)) &&
      (!activeFilters.element.length ||
        activeFilters.element.includes(c.element)) &&
      (!activeFilters.class.length ||
        activeFilters.class.includes(c.class)) &&
      c.name.toLowerCase().includes(searchInput.value.toLowerCase())
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

/* ============ RENDER CARDLIST ======== */
function renderCardList() {
  const keyword = cardSearchInput.value.toLowerCase();
  cardListEl.innerHTML = "";

  cards
    .filter(c => c.name.toLowerCase().includes(keyword))
    .forEach(card => {
      const el = document.createElement("div");
      el.className = "card-item";

      el.innerHTML = `
        <img src="${card.image}">
        <strong>${card.name}</strong>
      `;

      el.onclick = () => {
  if (activeCardSlotIndex === null) return;

  cardSlots[activeCardSlotIndex] = card;
  closeCardPopup();
  saveAndRenderCards();
};

      cardListEl.appendChild(el);
    });
}

/* ================= CHARACTER CLICK ================= */
function onCharacterClick(character) {
  // REMOVE JIKA SUDAH ADA
  const existIndex = team.findIndex(
    t => t && t.name === character.name
  );

  if (existIndex !== -1) {
    team[existIndex] = null;
    clearSelectedSlot();
    saveAndRender();
    return;
  }

  // INSERT KE SLOT YANG DIPILIH
  if (selectedSlotIndex !== null) {
    team[selectedSlotIndex] = character;
    clearSelectedSlot();
    saveAndRender();
    return;
  }

  // INSERT KE SLOT KOSONG PERTAMA
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
    const pair = document.createElement("div");
    pair.className = "team-pair";

    /* ===== TEAM SLOT (EXISTING LOGIC) ===== */
    const slot = document.createElement("div");
    slot.dataset.index = i;

    if (team[i]) {
      slot.className = "team-card";
      slot.innerHTML = `
        <img src="${team[i].image}">
        <strong>${team[i].name}</strong>
      `;
      slot.onclick = () => {
        team[i] = null;
        clearSelectedSlot();
        saveAndRender();
      };
    } else {
      slot.className = "team-slot";
      slot.onclick = () => selectSlot(i, slot);
    }

    /* ===== CARD SLOT ===== */
    const cardSlot = document.createElement("div");
cardSlot.dataset.index = i;

if (cardSlots[i]) {
  cardSlot.className = "card-slot";
  cardSlot.innerHTML = `
    <img src="${cardSlots[i].image}">
    <strong>${cardSlots[i].name}</strong>
  `;
} else {
  cardSlot.className = "card-slot empty";
}

cardSlot.onclick = () => {
  openCardPopup(i);
};

    /* ===== APPEND ===== */
    pair.appendChild(slot);
    pair.appendChild(cardSlot);
    teamEl.appendChild(pair);
  }

  renderSynergyWarning();
  renderCharacters();
}

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

/* ================= SYNERGY WARNING ================= */
let synergyWarningEls = [];

function renderSynergyWarning() {
  synergyWarningEls.forEach(el => el.remove());
  synergyWarningEls = [];

  const activeTeam = team.filter(Boolean);
  if (!activeTeam.length) return;
  if (activeTeam.some(c => c.name === "Claire")) return;

  const classes = activeTeam.map(c => c.class);
  const hasKnight = classes.includes("Knight");
  const hasHealer = classes.includes("Healer");

  const warnings = [];

  if (classes.every(c => c === "Wizard" || c === "Archer")) {
    warnings.push("Tidak ada sustain");
    warnings.push("Tidak ada frontline");
  } else {
    if (
      classes.every(c =>
        ["Knight", "Wizard", "Archer"].includes(c)
      ) &&
      !hasHealer
    ) {
      warnings.push("Tidak ada sustain");
    }
    if (
      classes.every(c =>
        ["Wizard", "Archer", "Healer"].includes(c)
      ) &&
      !hasKnight
    ) {
      warnings.push("Tidak ada frontline");
    }
  }

  if (!warnings.length) return;

  const filtersUI = document.querySelector(".filters-ui");
  warnings.forEach(text => {
    const box = document.createElement("div");
    box.className = "synergy-warning";
    box.textContent = "⚠ " + text;
    filtersUI.parentNode.insertBefore(box, filtersUI);
    synergyWarningEls.push(box);
  });
}

/* ============ Close Popup ============ */
function openCardPopup(index) {
  activeCardSlotIndex = index;
  cardPopup.classList.remove("hidden");
}

function closeCardPopup() {
  activeCardSlotIndex = null;
  cardPopup.classList.add("hidden");
}

/* ========== SAVE RENDER CARD SLOT ======= */
function saveAndRenderCards() {
  persistCards();
  renderTeam();
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

function persistCards() {
  localStorage.setItem("cardSlots", JSON.stringify(cardSlots));
}

function loadCardsFromStorage() {
  const saved = JSON.parse(localStorage.getItem("cardSlots"));
  if (Array.isArray(saved)) {
    cardSlots = saved;
  }
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

shareBtn.onclick = () => {
  navigator.clipboard.writeText(location.href);
  alert("Link copied!");
};

/* ============== CARD POPUP EVENT ========= */
closeCardPopupBtn.onclick = closeCardPopup;

cardPopup.onclick = (e) => {
  if (e.target === cardPopup) {
    closeCardPopup();
  }
};

/* ======== SEARCH CARD IN POPUP ======= */
cardSearchInput.oninput = renderCardList;
