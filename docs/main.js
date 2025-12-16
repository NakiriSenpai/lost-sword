"use strict";

/* ========================================================= LOST SWORD TEAM BUILDER — MAIN.JS FINAL

Click toggle add/remove

Drag & drop list → team

Drag & drop team ↔ team (swap)

Drag keluar team = auto remove

Highlight slot target

Synergy warning logic (Claire exception) ========================================================= */


/* ================= CONSTANT ================= */ 
const MAX_TEAM = 5; const FALLBACK_IMG = "https://via.placeholder.com/300x200?text=No+Image";

/* ================= STATE ================= */ 
let characters = []; let team = []; let activeFilters = { position: [], element: [], class: [] }; let synergyWarningEls = [];

/* ================= DOM ================= */ 
const charsEl = document.getElementById("characters"); const teamEl = document.getElementById("team"); const shareBtn = document.getElementById("shareBtn"); const searchInput = document.getElementById("searchInput"); const filtersBar = document.querySelector(".filters-bar");

/* ================= RESET FILTER ================= */ 
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
    const allBtn = document.querySelector(
      `.filter-btn[data-type="${type}"][data-value=""]`
    );
    if (allBtn) allBtn.classList.remove("active");

    btn.classList.toggle("active");
    if (btn.classList.contains("active")) {
      if (!activeFilters[type].includes(value)) activeFilters[type].push(value);
    } else {
      activeFilters[type] = activeFilters[type].filter(v => v !== value);
    }
  }

  toggleResetButton();
  renderCharacters();
});

});

searchInput.addEventListener("input", () => { toggleResetButton(); renderCharacters(); }); }

resetFilterBtn.onclick = () => { activeFilters = { position: [], element: [], class: [] }; searchInput.value = ""; document.querySelectorAll(".filter-btn").forEach(btn => { btn.classList.remove("active"); if (btn.dataset.value === "") btn.classList.add("active"); }); resetFilterBtn.style.display = "none"; renderCharacters(); };

function toggleResetButton() { const active = activeFilters.position.length || activeFilters.element.length || activeFilters.class.length || searchInput.value.trim();

resetFilterBtn.style.display = active ? "block" : "none"; }

/* ================= CHARACTERS ================= */ 
function renderCharacters() { charsEl.innerHTML = "";

characters .filter(c => (!activeFilters.position.length || activeFilters.position.includes(c.position)) && (!activeFilters.element.length || activeFilters.element.includes(c.element)) && (!activeFilters.class.length || activeFilters.class.includes(c.class)) && c.name.toLowerCase().includes(searchInput.value.toLowerCase()) ) .forEach(c => { const card = document.createElement("div"); card.className = "card"; card.draggable = true;

if (team.some(t => t && t.name === c.name)) card.classList.add("in-team");

  card.innerHTML = `
    <img src="${c.image}">
    <strong>${c.name}</strong>
    <span>${c.element} • ${c.class} • ${c.position}</span>
  `;

  card.onclick = () => toggleCharacterInTeam(c);

  card.addEventListener("dragstart", e => {
    e.dataTransfer.setData("type", "character");
    e.dataTransfer.setData("char", c.name);
  });

  charsEl.appendChild(card);
});

}

/* ================= TEAM ================= */ 
function toggleCharacterInTeam(character) { const index = team.findIndex(t => t && t.name === character.name);

if (index !== -1) { team[index] = null; } else { const empty = team.findIndex(t => t === null); if (empty === -1) return alert("Max 5 characters"); team[empty] = character; }

persist(); updateURL(); renderTeam(); }

function renderTeam() { while (team.length < MAX_TEAM) team.push(null);

teamEl.innerHTML = "";

for (let i = 0; i < MAX_TEAM; i++) { const slot = document.createElement("div"); slot.dataset.index = i;

slot.addEventListener("dragover", e => {
  e.preventDefault();
  slot.classList.add("drag-over");
});

slot.addEventListener("dragleave", () => {
  slot.classList.remove("drag-over");
});

slot.addEventListener("drop", onDrop);

if (team[i]) {
  slot.className = "team-card";
  slot.draggable = true;
  slot.innerHTML = `<img src="${team[i].image}"><strong>${team[i].name}</strong>`;

  slot.onclick = () => removeFromTeam(i);

  slot.addEventListener("dragstart", e => {
    e.dataTransfer.setData("type", "team");
    e.dataTransfer.setData("from", i);
  });
} else {
  slot.className = "team-slot";
}

teamEl.appendChild(slot);

}

renderSynergyWarning(); renderCharacters(); }

function removeFromTeam(index) { const slot = teamEl.children[index]; if (slot) slot.classList.add("fade-out");

setTimeout(() => { team[index] = null; persist(); updateURL(); renderTeam(); }, 200); }

function onDrop(e) { e.preventDefault();

const targetIndex = Number(this.dataset.index); const type = e.dataTransfer.getData("type");

this.classList.remove("drag-over");

if (type === "character") { const name = e.dataTransfer.getData("char"); const c = characters.find(x => x.name === name); if (!c || team.some(t => t && t.name === c.name)) return; team[targetIndex] = c; }

if (type === "team") { const from = Number(e.dataTransfer.getData("from")); if (from === targetIndex) return; [team[from], team[targetIndex]] = [team[targetIndex], team[from]]; }

persist(); updateURL(); renderTeam(); }

/* ================= SYNERGY WARNING ================= */ 
function renderSynergyWarning() { synergyWarningEls.forEach(el => el.remove()); synergyWarningEls = [];

const valid = team.filter(Boolean); if (!valid.length) return;

if (valid.some(c => c.name === "Claire")) return;

const classes = valid.map(c => c.class); const hasKnight = classes.includes("Knight"); const hasHealer = classes.includes("Healer");

const only = allowed => classes.every(c => allowed.includes(c));

const warnings = [];

if (only(["Wizard", "Archer"])) { warnings.push("Kamu tidak memiliki unit sustain (shield, lifesteal, heals) di dalam tim"); warnings.push("Kamu tidak memiliki unit frontline (Knight) untuk menahan serangan"); } else { if (only(["Knight", "Wizard", "Archer"]) && !hasHealer) warnings.push("Kamu tidak memiliki unit sustain (shield, lifesteal, heals) di dalam tim");

if (only(["Wizard", "Archer", "Healer"]) && !hasKnight)
  warnings.push("Kamu tidak memiliki unit frontline (Knight) untuk menahan serangan");

}

const filtersUI = document.querySelector(".filters-ui");

warnings.forEach(text => { const box = document.createElement("div"); box.className = "synergy-warning"; box.textContent = "⚠ " + text; filtersUI.parentNode.insertBefore(box, filtersUI); synergyWarningEls.push(box); }); }

/* ================= STORAGE ================= */ 
function persist() { localStorage.setItem("team", JSON.stringify(team)); }

function loadFromURLorStorage() { const p = new URLSearchParams(location.search).get("team"); if (p) { team = p.split(",").map(decodeURIComponent).map(n => characters.find(c => c.name === n)); return; }

const s = localStorage.getItem("team"); if (s) team = JSON.parse(s); }

/* ================= SHARE ================= */ 
function updateURL() { const names = team.filter(Boolean).map(t => encodeURIComponent(t.name)).join(","); history.replaceState(null, "", names ? ?team=${names} : location.pathname); }

shareBtn.onclick = () => { navigator.clipboard.writeText(location.href); alert("Link copied!"); };
