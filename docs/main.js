"use strict";

/* ================= CONSTANT ================= */
const MAX_TEAM = 5;
const FALLBACK_IMG =
  "https://via.placeholder.com/300x200?text=No+Image";

/* ================= STATE ================= */
let characters = [];
let team = Array(MAX_TEAM).fill(null);
let selectedSlotIndex = null;

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

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
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
      normalizeTeam();
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

      if (team.some(t => t && t.name === c.name)) {
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

  // REMOVE
  if (existIndex !== -1) {
    team[existIndex] = null;
    normalizeTeam();
    persist();
    updateURL();
    renderTeam();
    renderCharacters();
    return;
  }

  // INSERT TO SELECTED SLOT
  if (selectedSlotIndex !== null) {
    team[selectedSlotIndex] = character;
    selectedSlotIndex = null;
    normalizeTeam();
    persist();
    updateURL();
    renderTeam();
    renderCharacters();
    return;
  }

  // INSERT TO FIRST EMPTY
  const empty = team.findIndex(t => t === null);
  if (empty === -1) {
    alert("Max 5 characters");
    return;
  }

  team[empty] = character;
  normalizeTeam();
  persist();
  updateURL();
  renderTeam();
  renderCharacters();
}

/* ================= TEAM ================= */
function renderTeam() {
  teamEl.innerHTML = "";

  for (let i = 0; i < MAX_TEAM; i++) {
    const slot = document.createElement("div");

    if (team[i]) {
      slot.className = "team-card";
      slot.innerHTML = `
        <img src="${team[i].image}">
        <strong>${team[i].name}</strong>
      `;
      slot.onclick = () => {
        team[i] = null;
        normalizeTeam();
        persist();
        updateURL();
        renderTeam();
        renderCharacters();
      };
    } else {
      slot.className = "team-slot";
      slot.onclick = () => {
        selectedSlotIndex = i;
        document
          .querySelectorAll(".selected-slot")
          .forEach(e => e.classList.remove("selected-slot"));
        slot.classList.add("selected-slot");
      };
    }

    teamEl.appendChild(slot);
  }

  renderSynergyWarning();
}

/* ================= SYNERGY WARNING ================= */
let synergyWarningEls = [];

function renderSynergyWarning() {
  synergyWarningEls.forEach(e => e.remove());
  synergyWarningEls = [];

  const activeTeam = team.filter(Boolean);
  if (!activeTeam.length) return;
  if (activeTeam.some(c => c.name === "Claire")) return;

  const classes = activeTeam.map(c => c.class);
  const hasKnight = classes.includes("Knight");
  const hasHealer = classes.includes("Healer");

  const onlyWA = classes.every(c => c === "Wizard" || c === "Archer");
  const onlyKWA = classes.every(c =>
    ["Knight", "Wizard", "Archer"].includes(c)
  );
  const onlyWAH = classes.every(c =>
    ["Wizard", "Archer", "Healer"].includes(c)
  );

  const warnings = [];

  if (onlyWA) {
    warnings.push("Anda tidak memiliki unit sustain (shield, lifesteal, heals)");
    warnings.push("Anda tidak memiliki unit frontline (Knight)");
  } else {
    if (onlyKWA && !hasHealer)
      warnings.push("Anda tidak memiliki unit sustain (shield, lifesteal, heals)");
    if (onlyWAH && !hasKnight)
      warnings.push("Anda tidak memiliki unit frontline (Knight)");
  }

  const filtersUI = document.querySelector(".filters-ui");
  warnings.forEach(text => {
    const box = document.createElement("div");
    box.className = "synergy-warning";
    box.textContent = "⚠ " + text;
    filtersUI.parentNode.insertBefore(box, filtersUI);
    synergyWarningEls.push(box);
  });
}

/* ================= STORAGE ================= */
function normalizeTeam() {
  team = team.filter(Boolean);
  while (team.length < MAX_TEAM) team.push(null);
}

function persist() {
  localStorage.setItem("team", JSON.stringify(team));
}

function loadFromURLorStorage() {
  const p = new URLSearchParams(location.search).get("team");
  if (p) {
    team = p
      .split(",")
      .map(decodeURIComponent)
      .map(n => characters.find(c => c.name === n))
      .filter(Boolean);
  } else {
    const s = localStorage.getItem("team");
    if (s) team = JSON.parse(s);
  }
}

function updateURL() {
  const names = team
    .filter(Boolean)
    .map(t => encodeURIComponent(t.name))
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
