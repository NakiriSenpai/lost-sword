"use strict";

/* ================= CONSTANT ================= */
const MAX_TEAM = 5;
const FALLBACK_IMG =
  "https://via.placeholder.com/300x200?text=No+Image";

/* ================= STATE ================= */
let characters = [];
let team = [];

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

/* ================= RESET BUTTON ================= */
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
      setupFilters();
      renderCharacters();
      renderTeam();
    })
    .catch(err => console.error("JSON LOAD ERROR", err));
});

/* ================= FILTER ================= */
function setupFilters() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
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
          activeFilters[type] = activeFilters[type].filter(v => v !== value);
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

/* ================= RESET ================= */
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

function toggleResetButton() {
  const active =
    activeFilters.position.length ||
    activeFilters.element.length ||
    activeFilters.class.length ||
    searchInput.value.trim();

  resetFilterBtn.style.display = active ? "block" : "none";
}

/* ================= CHARACTERS ================= */
function renderCharacters() {
  charsEl.innerHTML = "";

  characters
    .filter(c =>
      (!activeFilters.position.length || activeFilters.position.includes(c.position)) &&
      (!activeFilters.element.length || activeFilters.element.includes(c.element)) &&
      (!activeFilters.class.length || activeFilters.class.includes(c.class)) &&
      c.name.toLowerCase().includes(searchInput.value.toLowerCase())
    )
    .forEach(c => {
      const card = document.createElement("div");
      card.className = "card";
      card.draggable = true;

      if (team.some(t => t && t.name === c.name)) {
        card.classList.add("in-team");
      }

      card.innerHTML = `
        <img src="${c.image}">
        <strong>${c.name}</strong>
        <span>${c.element} • ${c.class} • ${c.position}</span>
      `;

      card.onclick = () => toggleCharacterInTeam(c);

      card.addEventListener("dragstart", e => {
        e.dataTransfer.setData("type", "character");
        e.dataTransfer.setData("name", c.name);
      });

      charsEl.appendChild(card);
    });
}

/* ================= TEAM ================= */
function toggleCharacterInTeam(c) {
  const index = team.findIndex(t => t && t.name === c.name);

  if (index !== -1) {
    team[index] = null;
  } else {
    const empty = team.indexOf(null);
    if (empty === -1) {
      alert("Max 5 characters");
      return;
    }
    team[empty] = c;
  }

  persist();
  updateURL();
  renderTeam();
}

function renderTeam() {
  while (team.length < MAX_TEAM) team.push(null);

  teamEl.innerHTML = "";

  team.forEach((member, i) => {
    const slot = document.createElement("div");
    slot.dataset.index = i;

    slot.addEventListener("dragover", e => {
      e.preventDefault();
      slot.classList.add("drag-over");
    });

    slot.addEventListener("dragleave", () => {
      slot.classList.remove("drag-over");
    });

    slot.addEventListener("drop", e => onDrop(e, slot));

    if (member) {
      slot.className = "team-card";
      slot.draggable = true;

      slot.innerHTML = `
        <img src="${member.image}">
        <strong>${member.name}</strong>
      `;

      slot.onclick = () => {
        slot.classList.add("fade-out");
        setTimeout(() => {
          team[i] = null;
          persist();
          updateURL();
          renderTeam();
        }, 200);
      };

      slot.addEventListener("dragstart", e => {
        e.dataTransfer.setData("type", "team");
        e.dataTransfer.setData("from", i);
      });
    } else {
      slot.className = "team-slot";
    }

    teamEl.appendChild(slot);
  });

  renderSynergyWarning();
  renderCharacters();
}

function onDrop(e, slot) {
  e.preventDefault();
  slot.classList.remove("drag-over");

  const targetIndex = Number(slot.dataset.index);
  const type = e.dataTransfer.getData("type");

  if (type === "character") {
    const name = e.dataTransfer.getData("name");
    const c = characters.find(x => x.name === name);
    if (!c || team.some(t => t && t.name === name)) return;
    team[targetIndex] = c;
  }

  if (type === "team") {
    const from = Number(e.dataTransfer.getData("from"));
    [team[from], team[targetIndex]] = [team[targetIndex], team[from]];
  }

  persist();
  updateURL();
  renderTeam();
}

/* ================= SYNERGY WARNING ================= */
let synergyEls = [];

function renderSynergyWarning() {
  synergyEls.forEach(el => el.remove());
  synergyEls = [];

  const validTeam = team.filter(Boolean);
  if (!validTeam.length) return;
  if (validTeam.some(c => c.name === "Claire")) return;

  const classes = validTeam.map(c => c.class);
  const warnings = [];

  const hasKnight = classes.includes("Knight");
  const hasHealer = classes.includes("Healer");

  if (!hasHealer && classes.every(c => c !== "Healer")) {
    warnings.push("Anda tidak memiliki unit sustain (shield, lifesteal, heals)");
  }

  if (!hasKnight && classes.every(c => c !== "Knight")) {
    warnings.push("Anda tidak memiliki unit frontline (Knight)");
  }

  const filtersUI = document.querySelector(".filters-ui");

  warnings.forEach(text => {
    const box = document.createElement("div");
    box.className = "synergy-warning";
    box.textContent = "⚠ " + text;
    filtersUI.parentNode.insertBefore(box, filtersUI);
    synergyEls.push(box);
  });
}

/* ================= STORAGE ================= */
function persist() {
  localStorage.setItem("team", JSON.stringify(team));
}

function loadFromURLorStorage() {
  const p = new URLSearchParams(location.search).get("team");
  team = new Array(MAX_TEAM).fill(null);

  if (p) {
    p.split(",")
      .map(decodeURIComponent)
      .forEach((name, i) => {
        const c = characters.find(x => x.name === name);
        if (c && i < MAX_TEAM) team[i] = c;
      });
    return;
  }

  const s = localStorage.getItem("team");
  if (s) {
    const saved = JSON.parse(s);
    saved.forEach((c, i) => {
      if (c && i < MAX_TEAM) team[i] = c;
    });
  }
}

/* ================= SHARE ================= */
function updateURL() {
  const names = team.filter(Boolean).map(c => encodeURIComponent(c.name)).join(",");
  history.replaceState(null, "", names ? "?team=" + names : location.pathname);
}

shareBtn.onclick = () => {
  navigator.clipboard.writeText(location.href);
  alert("Link copied!");
};
