"use strict";

/* ========================================================= LOST SWORD TEAM BUILDER – FINAL STABLE VERSION (klik slot → pilih target, klik character → isi slot) ========================================================= */

/* ================= CONSTANT ================= */
const MAX_TEAM = 5; const FALLBACK_IMG = "https://via.placeholder.com/300x200?text=No+Image";

/* ================= STATE ================= */
let characters = []; let team = []; let selectedSlotIndex = null; // slot yang dipilih manual

let activeFilters = { position: [], element: [], class: [] };

/* ================= DOM ================= */ 
const charsEl = document.getElementById("characters"); const teamEl = document.getElementById("team"); const shareBtn = document.getElementById("shareBtn"); const searchInput = document.getElementById("searchInput"); const filtersBar = document.querySelector(".filters-bar");

/* ================= RESET FILTER BUTTON ================= */ 
const resetFilterBtn = document.createElement("button"); resetFilterBtn.id = "resetFilterBtn"; resetFilterBtn.textContent = "RESET FILTER"; resetFilterBtn.style.display = "none"; filtersBar.appendChild(resetFilterBtn);

/* ================= INIT ================= */ 
document.addEventListener("DOMContentLoaded", () => { fetch("data/characters.json") .then(r => r.json()) .then(data => { characters = data.map(c => ({ name: c.name, element: c.element, class: c.class, position: c.position, image: c.image && c.image.trim() ? c.image : FALLBACK_IMG }));

loadFromURLorStorage();
  normalizeTeam();
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

/* ================= CHARACTER LIST ================= */ 
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

/* ================= CHARACTER CLICK LOGIC ================= */ 
function onCharacterClick(character) { 
  // jika character sudah ada → remove 
  const existIndex = team.findIndex(t => t && t.name === character.name); if (existIndex !== -1) { team[existIndex] = null; normalizeTeam(); clearSelectedSlot(); persist(); updateURL(); renderTeam(); return; }

// jika user pilih slot dulu 
  if (selectedSlotIndex !== null) { team[selectedSlotIndex] = character; normalizeTeam(); clearSelectedSlot(); persist(); updateURL(); renderTeam(); return; }

// default: isi slot kosong pertama 
  const emptyIndex = team.findIndex(t => t === null); if (emptyIndex === -1) { alert("Max 5 characters"); return; }

team[emptyIndex] = character; normalizeTeam(); persist(); updateURL(); renderTeam(); }

/* ================= TEAM RENDER ================= */
function renderTeam() { teamEl.innerHTML = "";

for (let i = 0; i < MAX_TEAM; i++) { const slot = document.createElement("div"); slot.dataset.index = i;

if (team[i]) {
  slot.className = "team-card";
  slot.innerHTML = `
    <img src="${team[i].image}">
    <strong>${team[i].name}</strong>
  `;

  // klik slot berisi = remove
  slot.onclick = () => {
    team[i] = null;
    normalizeTeam();
    clearSelectedSlot();
    persist();
    updateURL();
    renderTeam();
  };
} else {
  slot.className = "team-slot";

  // klik slot kosong = pilih slot target
  slot.onclick = () => selectSlot(i, slot);
}

if (selectedSlotIndex === i) {
  slot.classList.add("selected-slot");
}

teamEl.appendChild(slot);

}

renderSynergyWarning(); renderCharacters(); }

function selectSlot(index, el) { clearSelectedSlot(); selectedSlotIndex = index; el.classList.add("selected-slot"); }

function clearSelectedSlot() { selectedSlotIndex = null; document .querySelectorAll(".selected-slot") .forEach(el => el.classList.remove("selected-slot")); }

/* ================= SYNERGY WARNING ================= */ 
let synergyWarningEls = [];

function renderSynergyWarning() { synergyWarningEls.forEach(el => el.remove()); synergyWarningEls = [];

const activeTeam = team.filter(Boolean); if (!activeTeam.length) return;

// exception Claire 
if (activeTeam.some(c => c.name === "Claire")) return;

const classes = activeTeam.map(c => c.class);

const hasKnight = classes.includes("Knight"); const hasHealer = classes.includes("Healer");

const onlyKnightWizardArcher = classes.every(c => c === "Knight" || c === "Wizard" || c === "Archer" );

const onlyWizardArcherHealer = classes.every(c => c === "Wizard" || c === "Archer" || c === "Healer" );

const onlyWizardArcher = classes.every(c => c === "Wizard" || c === "Archer" );

const warnings = [];

if (onlyWizardArcher) { warnings.push("Anda tidak memiliki unit sustain (shield, lifesteal, heals) di dalam tim"); warnings.push("Anda tidak memiliki unit frontline (Knight) untuk menahan serangan"); } else { if (onlyKnightWizardArcher && !hasHealer) { warnings.push("Anda tidak memiliki unit sustain (shield, lifesteal, heals) di dalam tim"); } if (onlyWizardArcherHealer && !hasKnight) { warnings.push("Anda tidak memiliki unit frontline (Knight) untuk menahan serangan"); } }

if (!warnings.length) return;

const filtersUI = document.querySelector(".filters-ui");

warnings.forEach(text => { const box = document.createElement("div"); box.className = "synergy-warning"; box.textContent = "⚠ " + text; filtersUI.parentNode.insertBefore(box, filtersUI); synergyWarningEls.push(box); }); }

/* ================= HELPERS ================= */ 
function normalizeTeam() { team = team.filter(Boolean); while (team.length < MAX_TEAM) team.push(null); }

/* ================= STORAGE & SHARE ================= */ 
function persist() { localStorage.setItem("team", JSON.stringify(team)); }

function loadFromURLorStorage() { const p = new URLSearchParams(location.search).get("team"); if (p) { team = p .split(",") .map(decodeURIComponent) .map(n => characters.find(c => c.name === n)) .filter(Boolean); return; }

const s = localStorage.getItem("team"); if (s) team = JSON.parse(s); }

function updateURL() { const names = team .filter(Boolean) .map(t => encodeURIComponent(t.name)) .join(",");

history.replaceState(null, "", names ? ?team=${names} : location.pathname); }

shareBtn.onclick = () => { navigator.clipboard.writeText(location.href); alert("Link copied!"); };
