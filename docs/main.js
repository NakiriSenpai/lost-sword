"use strict";

/* =========================================================
   CONSTANT
========================================================= */
const MAX_TEAM = 5;
const FALLBACK_IMG =
  "https://via.placeholder.com/300x200?text=No+Image";

/* =========================================================
   STATE
========================================================= */
let characters = [];
let team = [];
let selectedTeamSlot = null;
let swapSourceSlot = null;

let activeFilters = {
  position: [],
  element: [],
  class: []
};

/* =========================================================
   DOM
========================================================= */
const charsEl = document.getElementById("characters");
const teamEl = document.getElementById("team");
const shareBtn = document.getElementById("shareBtn");
const searchInput = document.getElementById("searchInput");
const filtersBar = document.querySelector(".filters-bar");

/* =========================================================
   RESET FILTER BUTTON
========================================================= */
const resetFilterBtn = document.createElement("button");
resetFilterBtn.id = "resetFilterBtn";
resetFilterBtn.textContent = "RESET FILTER";
resetFilterBtn.style.display = "none";
filtersBar.appendChild(resetFilterBtn);

/* =========================================================
   INIT
========================================================= */
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
    })
    .catch(err => console.error("JSON LOAD ERROR", err));
});

/* =========================================================
   FILTER
========================================================= */
function setupFilters() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      const value = btn.dataset.value;

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
    });
  });

  searchInput.addEventListener("input", () => {
    toggleResetButton();
    renderCharacters();
  });
}

function toggleResetButton() {
  const active =
    activeFilters.position.length ||
    activeFilters.element.length ||
    activeFilters.class.length ||
    searchInput.value.trim();

  resetFilterBtn.style.display = active ? "block" : "none";
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

/* =========================================================
   CHARACTERS LIST
========================================================= */
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

      card.onclick = () => toggleCharacterInTeam(c);
      charsEl.appendChild(card);
    });
}

/* =========================================================
   TEAM LOGIC
========================================================= */
function toggleCharacterInTeam(c) {
  const existingIndex = team.findIndex(t => t?.name === c.name);

  // REMOVE
  if (existingIndex !== -1) {
    animateSlot(existingIndex, () => {
      team[existingIndex] = null;
      normalizeTeam();
      persist();
      updateURL();
      renderTeam();
    });
    return;
  }

  // INSERT TO SELECTED SLOT
  if (selectedTeamSlot !== null) {
    animateSlot(selectedTeamSlot, () => {
      team[selectedTeamSlot] = c;
      clearSelection();
      normalizeTeam();
      persist();
      updateURL();
      renderTeam();
    });
    return;
  }

  // INSERT TO FIRST EMPTY SLOT
  const empty = team.indexOf(null);
  if (empty === -1) {
    alert("Max 5 characters");
    return;
  }

  animateSlot(empty, () => {
    team[empty] = c;
    normalizeTeam();
    persist();
    updateURL();
    renderTeam();
  });
}

function renderTeam() {
  teamEl.innerHTML = "";

  for (let i = 0; i < MAX_TEAM; i++) {
    const slot = document.createElement("div");
    slot.dataset.index = i;

    if (team[i]) {
      slot.className = "team-card";
      slot.innerHTML = `
        <img src="${team[i].image}">
        <strong>${team[i].name}</strong>
      `;
    } else {
      slot.className = "team-slot";
    }

    slot.onclick = () => handleSlotClick(i, slot);
    teamEl.appendChild(slot);
  }
  renderSynergyWarning();
  renderCharacters();
}

/* =========================================================
   TEAM SYNERGY WARNING
========================================================= */
let synergyWarningEls = [];

function renderSynergyWarning() {
  // hapus warning lama
  synergyWarningEls.forEach(el => el.remove());
  synergyWarningEls = [];

  const activeTeam = team.filter(Boolean);
  if (!activeTeam.length) return;

  // EXCEPTION: Claire
  if (activeTeam.some(c => c.name === "Claire")) return;

  const classes = activeTeam.map(c => c.class);

  const hasKnight = classes.includes("Knight");
  const hasHealer = classes.includes("Healer");

  const onlyKnightWizardArcher = classes.every(c =>
    c === "Knight" || c === "Wizard" || c === "Archer"
  );

  const onlyWizardArcherHealer = classes.every(c =>
    c === "Wizard" || c === "Archer" || c === "Healer"
  );

  const onlyWizardArcher = classes.every(c =>
    c === "Wizard" || c === "Archer"
  );

  const warnings = [];

  // RULE 3 (PALING SPESIFIK)
  if (onlyWizardArcher) {
    warnings.push(
      "Anda tidak memiliki unit sustain (shield, lifesteal, heals) di dalam tim"
    );
    warnings.push(
      "Anda tidak memiliki unit frontline (Knight) untuk menahan serangan"
    );
  } else {
    if (onlyKnightWizardArcher && !hasHealer) {
      warnings.push(
        "Anda tidak memiliki unit sustain (shield, lifesteal, heals) di dalam tim"
      );
    }

    if (onlyWizardArcherHealer && !hasKnight) {
      warnings.push(
        "Anda tidak memiliki unit frontline (Knight) untuk menahan serangan"
      );
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

function handleSlotClick(index, slotEl) {
  // SWAP MODE
  if (team[index]) {
    if (swapSourceSlot === null) {
      swapSourceSlot = index;
      slotEl.classList.add("selected-slot");
      return;
    }

    if (swapSourceSlot !== index) {
      animateSwap(swapSourceSlot, index);
    }

    clearSelection();
    return;
  }

  // SELECT SLOT MODE
  clearSelection();
  selectedTeamSlot = index;
  slotEl.classList.add("selected-slot");
}

/* =========================================================
   ANIMATION
========================================================= */
function animateSlot(index, callback) {
  const el = teamEl.children[index];
  if (!el) return callback();

  el.classList.add("fade-out");
  setTimeout(() => {
    el.classList.remove("fade-out");
    callback();
  }, 200);
}

function animateSwap(a, b) {
  const elA = teamEl.children[a];
  const elB = teamEl.children[b];

  elA.classList.add("swap");
  elB.classList.add("swap");

  setTimeout(() => {
    [team[a], team[b]] = [team[b], team[a]];
    persist();
    updateURL();
    renderTeam();
  }, 250);
}

/* =========================================================
   HELPERS
========================================================= */
function normalizeTeam() {
  team = team.filter(Boolean);
  while (team.length < MAX_TEAM) team.push(null);
}

function clearSelection() {
  selectedTeamSlot = null;
  swapSourceSlot = null;
  document
    .querySelectorAll(".selected-slot")
    .forEach(el => el.classList.remove("selected-slot"));
}

/* =========================================================
   STORAGE & SHARE
========================================================= */
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
    return;
  }

  const s = localStorage.getItem("team");
  if (s) team = JSON.parse(s);
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
