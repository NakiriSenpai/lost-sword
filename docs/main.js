"use strict";

/* ========================================================= LOST SWORD – TEAM BUILDER (FINAL STABLE) FIXED SLOT SELECTION + ANIMATION ========================================================= */

/* ================= CONSTANT ================= */ 
const MAX_TEAM = 5; const FALLBACK_IMG = "https://via.placeholder.com/300x200?text=No+Image";

/* ================= STATE ================= */ 
let characters = []; let team = Array(MAX_TEAM).fill(null); // ⚠️ SLOT INDEX HARUS STABIL let selectedSlotIndex = null;

let activeFilters = { position: [], element: [], class: [] };

/* ================= DOM ================= */
const charsEl = document.getElementById("characters"); const teamEl = document.getElementById("team"); const shareBtn = document.getElementById("shareBtn"); const searchInput = document.getElementById("searchInput"); const filtersBar = document.querySelector(".filters-bar");

/* ================= RESET FILTER BUTTON ================= */ 
const resetFilterBtn = document.createElement("button"); resetFilterBtn.id = "resetFilterBtn"; resetFilterBtn.textContent = "RESET FILTER"; resetFilterBtn.style.display = "none"; filtersBar.appendChild(resetFilterBtn);

/* ================= INIT ================= */ 
document.addEventListener("DOMContentLoaded", () => { fetch("data/characters.json") .then(r => r.json()) .then(data => { characters = data.map(c => ({ name: c.name, element: c.element, class: c.class, position: c.position, image: c.image && c.image.trim() ? c.image : FALLBACK_IMG }));

loadFromURLorStorage();
  setupFilters();
  renderCharacters();
  renderTeam();
})
.catch(err => console.error("JSON LOAD ERROR", err));

});

/* ================= FILTER ================= */ 
function setupFilters() { document.querySelectorAll(".filter-btn").forEach(btn => { btn.addEventListener("click", () => { const type = btn.dataset.type; const value = btn.dataset.value;

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
      if (!activeFilters[type].includes(value)) {
        activeFilters[type].push(value);
      }
    } else {
      activeFilters[type] = activeFilters[type].filter(v => v !== value);
    }
  }

  toggleResetButton();
  renderCharacters();
});

});

searchInput.addEventListener("input", () => { toggleResetButton(); renderCharacters(); }); }

function toggleResetButton() { const active = activeFilters.position.length || activeFilters.element.length || activeFilters.class.length || searchInput.value.trim();

resetFilterBtn.style.display = active ? "block" : "none"; }

resetFilterBtn.onclick = () => { activeFilters = { position: [], element: [], class: [] }; searchInput.value = "";

document.querySelectorAll(".filter-btn").forEach(btn => { btn.classList.remove("active"); if (btn.dataset.value === "") btn.classList.add("active"); });

resetFilterBtn.style.display = "none"; renderCharacters(); };

/* ================= CHARACTERS LIST ================= */
function renderCharacters() { charsEl.innerHTML = "";

characters .filter(c => (!activeFilters.position.length || activeFilters.position.includes(c.position)) && (!activeFilters.element.length || activeFilters.element.includes(c.element)) && (!activeFilters.class.length || activeFilters.class.includes(c.class)) && c.name.toLowerCase().includes(searchInput.value.toLowerCase()) ) .forEach(c => { const card = document.createElement("div"); card.className = "card";

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

/* ================= CHARACTER CLICK LOGIC (FINAL) ================= */
function onCharacterClick(character) { const existIndex = team.findIndex(t => t && t.name === character.name);

// REMOVE 
if (existIndex !== -1) { animateFade(existIndex, () => { team[existIndex] = null; clearSelectedSlot(); persist(); updateURL(); renderTeam(); renderCharacters(); }); return; }

// INSERT TO SELECTED SLOT 
if (selectedSlotIndex !== null) { animateFade(selectedSlotIndex, () => { team[selectedSlotIndex] = character; clearSelectedSlot(); persist(); updateURL(); renderTeam(); renderCharacters(); }); return; }

// INSERT TO FIRST EMPTY SLOT 
const emptyIndex = team.findIndex(t => t === null); if (emptyIndex === -1) { alert("Max 5 characters"); return; }

animateFade(emptyIndex, () => { team[emptyIndex] = character; persist(); updateURL(); renderTeam(); renderCharacters(); }); }

/* ================= TEAM RENDER ================= */ 
function renderTeam() { teamEl.innerHTML = "";

for (let i = 0; i < MAX_TEAM; i++) { const slot = document.createElement("div"); slot.dataset.index = i;

if (team[i]) {
  slot.className = "team-card";
  slot.innerHTML = `
    <img src="${team[i].image}">
    <strong>${team[i].name}</strong>
  `;

  slot.onclick = () => {
    animateFade(i, () => {
      team[i] = null;
      clearSelectedSlot();
      persist();
      updateURL();
      renderTeam();
      renderCharacters();
    });
  };
} else {
  slot.className = "team-slot";
  slot.onclick = () => selectSlot(i, slot);
}

teamEl.appendChild(slot);

}

renderSynergyWarning(); }

function selectSlot(index, el) { clearSelectedSlot(); selectedSlotIndex = index; el.classList.add("selected-slot"); }

function clearSelectedSlot() { selectedSlotIndex = null; document.querySelectorAll(".selected-slot").forEach(e => e.classList.remove("selected-slot")); }

/* ================= FADE ANIMATION ================= */
function animateFade(index, callback) { const el = teamEl.children[index]; if (!el) return callback();

el.classList.add("fade-out"); setTimeout(() => { el.classList.remove("fade-out"); callback(); }, 200); }

/* ================= SYNERGY WARNING ================= */ 
let synergyWarningEls = [];

function renderSynergyWarning() { synergyWarningEls.forEach(el => el.remove()); synergyWarningEls = [];

const activeTeam = team.filter(Boolean); if (!activeTeam.length) return; if (activeTeam.some(c => c.name === "Claire")) return;

const classes = activeTeam.map(c => c.class); const hasKnight = classes.includes("Knight"); const hasHealer = classes.includes("Healer");

const onlyWizardArcher = classes.every(c => c === "Wizard" || c === "Archer"); const onlyKWA = classes.every(c => c === "Knight" || c === "Wizard" || c === "Archer"); const onlyWAH = classes.every(c => c === "Wizard" || c === "Archer" || c === "Healer");

const warnings = [];

if (onlyWizardArcher) { warnings.push("Anda tidak memiliki unit sustain (shield, lifesteal, heals) di dalam tim"); warnings.push("Anda tidak memiliki unit frontline (Knight) untuk menahan serangan"); } else { if (onlyKWA && !hasHealer) warnings.push("Anda tidak memiliki unit sustain (shield, lifesteal, heals) di dalam tim"); if (onlyWAH && !hasKnight) warnings.push("Anda tidak memiliki unit frontline (Knight) untuk menahan serangan"); }

if (!warnings.length) return;

const filtersUI = document.querySelector(".filters-ui");

warnings.forEach(text => { const box = document.createElement("div"); box.className = "synergy-warning"; box.textContent = "⚠ " + text; filtersUI.parentNode.insertBefore(box, filtersUI); synergyWarningEls.push(box); }); }

/* ================= STORAGE & SHARE ================= */ 
function persist() { localStorage.setItem("team", JSON.stringify(team)); }

function loadFromURLorStorage() { const p = new URLSearchParams(location.search).get("team"); if (p) { const names = p.split(",").map(decodeURIComponent); team = Array(MAX_TEAM).fill(null); names.forEach((n, i) => { const c = characters.find(x => x.name === n); if (c && i < MAX_TEAM) team[i] = c; }); return; }

const s = localStorage.getItem("team"); if (s) { const saved = JSON.parse(s); team = Array(MAX_TEAM).fill(null); saved.forEach((c, i) => { if (c && i < MAX_TEAM) team[i] = c; }); } }

function updateURL() { const names = team.filter(Boolean).map(t => encodeURIComponent(t.name)).join(","); history.replaceState(null, "", names ? "?team=" + names : location.pathname); }

shareBtn.onclick = () => { navigator.clipboard.writeText(location.href); alert("Link copied!"); };
