"use strict";

/* ========================================================= LOST SWORD TEAM BUILDER main.js (Drag & Drop + Synergy) ========================================================= */

/* ===================== CONSTANT ===================== */ const MAX_TEAM = 5; const FALLBACK_IMG = "https://via.placeholder.com/300x200?text=No+Image";

/* ===================== STATE ===================== */ let characters = []; let team = [];

let activeFilters = { position: [], element: [], class: [] };

/* ===================== DOM ===================== */ const charsEl = document.getElementById("characters"); const teamEl = document.getElementById("team"); const shareBtn = document.getElementById("shareBtn"); const searchInput = document.getElementById("searchInput"); const filtersBar = document.querySelector(".filters-bar");

/* ===================== RESET BUTTON ===================== */ const resetFilterBtn = document.createElement("button"); resetFilterBtn.id = "resetFilterBtn"; resetFilterBtn.textContent = "RESET FILTER"; resetFilterBtn.style.display = "none"; filtersBar.appendChild(resetFilterBtn);

/* ===================== INIT ===================== */ document.addEventListener("DOMContentLoaded", init);

function init() { fetch("data/characters.json") .then(r => r.json()) .then(data => { characters = data.map(c => ({ ...c, image: c.image?.trim() ? c.image : FALLBACK_IMG }));

loadFromURLorStorage();
  setupFilters();
  renderCharacters();
  renderTeam();
});

}

/* ===================== FILTER ===================== */ function setupFilters() { document.querySelectorAll(".filter-btn").forEach(btn => { btn.addEventListener("click", () => { const { type, value } = btn.dataset;

if (value === "") {
    activeFilters[type] = [];
    document.querySelectorAll(`.filter-btn[data-type="${type}"]`)
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  } else {
    document.querySelector(`.filter-btn[data-type="${type}"][data-value=""]`)
      ?.classList.remove("active");

    btn.classList.toggle("active");
    if (btn.classList.contains("active")) {
      activeFilters[type].push(value);
    } else {
      activeFilters[type] = activeFilters[type].filter(v => v !== value);
    }
  }

  toggleResetButton();
  renderCharacters();
});

});

searchInput.addEventListener("input", () => { toggleResetButton(); renderCharacters(); }); }

resetFilterBtn.onclick = () => { activeFilters = { position: [], element: [], class: [] }; searchInput.value = "";

document.querySelectorAll(".filter-btn").forEach(btn => { btn.classList.remove("active"); if (btn.dataset.value === "") btn.classList.add("active"); });

resetFilterBtn.style.display = "none"; renderCharacters(); };

function toggleResetButton() { const active = activeFilters.position.length || activeFilters.element.length || activeFilters.class.length || searchInput.value.trim();

resetFilterBtn.style.display = active ? "block" : "none"; }

/* ===================== RENDER CHARACTERS ===================== */ function renderCharacters() { charsEl.innerHTML = "";

characters .filter(c => (!activeFilters.position.length || activeFilters.position.includes(c.position)) && (!activeFilters.element.length || activeFilters.element.includes(c.element)) && (!activeFilters.class.length || activeFilters.class.includes(c.class)) && c.name.toLowerCase().includes(searchInput.value.toLowerCase()) ) .forEach(c => { const card = document.createElement("div"); card.className = "card"; card.draggable = true;

if (team.some(t => t.name === c.name)) {
    card.classList.add("in-team");
  }

  card.innerHTML = `
    <img src="${c.image}" alt="${c.name}">
    <strong>${c.name}</strong>
    <span>${c.element} • ${c.class} • ${c.position}</span>
  `;

  card.addEventListener("click", () => addToTeam(c));
  card.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/plain", c.name);
  });

  charsEl.appendChild(card);
});

}

/* ===================== TEAM ===================== */ function addToTeam(c) { if (team.some(t => t.name === c.name)) return; if (team.length >= MAX_TEAM) return alert("Max 5 characters");

team.push(c); persist(); updateURL(); renderTeam(); }

function removeFromTeam(name) { team = team.filter(t => t.name !== name); persist(); updateURL(); renderTeam(); }

function renderTeam() { teamEl.innerHTML = "";

for (let i = 0; i < MAX_TEAM; i++) { const slot = document.createElement("div"); slot.className = team[i] ? "team-card" : "team-slot"; slot.dataset.index = i;

slot.addEventListener("dragover", e => e.preventDefault());
slot.addEventListener("drop", onDropToSlot);

if (team[i]) {
  slot.draggable = true;
  slot.innerHTML = `
    <img src="${team[i].image}">
    <strong>${team[i].name}</strong>
  `;

  slot.addEventListener("dragstart", e => {
    e.dataTransfer.setData("fromTeam", i);
  });

  slot.addEventListener("click", () => removeFromTeam(team[i].name));
}

teamEl.appendChild(slot);

}

renderSynergy(); renderCharacters(); }

function onDropToSlot(e) { e.preventDefault();

const slotIndex = Number(this.dataset.index); const fromTeam = e.dataTransfer.getData("fromTeam"); const charName = e.dataTransfer.getData("text/plain");

if (fromTeam !== "") { const fromIndex = Number(fromTeam); [team[fromIndex], team[slotIndex]] = [team[slotIndex], team[fromIndex]]; } else if (charName) { const char = characters.find(c => c.name === charName); if (!char || team.some(t => t.name === char.name)) return; team[slotIndex] = char; }

team = team.filter(Boolean); persist(); updateURL(); renderTeam(); }

/* ===================== SYNERGY ===================== */ function renderSynergy() { const synergy = {};

team.forEach(c => { synergy[c.element] = (synergy[c.element] || 0) + 1; });

document.querySelectorAll(".synergy")?.forEach(e => e.remove());

Object.entries(synergy).forEach(([element, count]) => { if (count >= 2) { const badge = document.createElement("div"); badge.className = "synergy"; badge.textContent = +${count} ${element}; teamEl.appendChild(badge); } }); }

/* ===================== PERSIST ===================== */ function persist() { localStorage.setItem("team", JSON.stringify(team)); }

function loadFromURLorStorage() { const p = new URLSearchParams(location.search).get("team"); if (p) { team = p.split(",") .map(decodeURIComponent) .map(n => characters.find(c => c.name === n)) .filter(Boolean); return; }

const s = localStorage.getItem("team"); if (s) team = JSON.parse(s); }

/* ===================== SHARE ===================== */ function updateURL() { const names = team.map(t => encodeURIComponent(t.name)).join(","); history.replaceState(null, "", names ? ?team=${names} : location.pathname); }

shareBtn.onclick = () => { navigator.clipboard.writeText(location.href); alert("Link copied!"); };
