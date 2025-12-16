/* =========================================================
   LOST SWORD TEAM BUILDER
   main.js
   ========================================================= */

/* ===================== CONSTANT ===================== */
const MAX_TEAM = 5;
const FALLBACK_IMG =
  "https://via.placeholder.com/300x200?text=No+Image";

/* ===================== STATE ===================== */
let characters = [];
let team = [];

let activeFilters = {
  position: [],
  element: [],
  class: []
};

/* ===================== DOM ===================== */
const charsEl = document.getElementById("characters");
const teamEl = document.getElementById("team");
const shareBtn = document.getElementById("shareBtn");
const searchInput = document.getElementById("searchInput");
const filtersUI = document.querySelector(".filters-ui");
const filtersBar = document.querySelector(".filters-bar");

/* ===================== RESET BUTTON ===================== */
const resetFilterBtn = document.createElement("button");
resetFilterBtn.id = "resetFilterBtn";
resetFilterBtn.textContent = "RESET FILTER";
resetFilterBtn.style.display = "none";
filtersBar.appendChild(resetFilterBtn);

/* ===================== INIT ===================== */
document.addEventListener("DOMContentLoaded", init);

function init() {
  console.log("Main.js loaded");

  fetch("data/characters.json")
    .then(res => res.json())
    .then(data => {
      characters = data.map(c => ({
        ...c,
        image: c.image && c.image.trim() ? c.image : FALLBACK_IMG
      }));

      loadFromURLorStorage();
      setupFilters();
      renderCharacters();
      renderTeam();
    })
    .catch(err => {
      console.error("Failed to load characters.json", err);
    });
}

/* ===================== FILTER SETUP ===================== */
function setupFilters() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      const value = btn.dataset.value;

      // ALL button
      if (value === "") {
        activeFilters[type] = [];

        document
          .querySelectorAll(`.filter-btn[data-type="${type}"]`)
          .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");
      } else {
        // remove ALL
        const allBtn = document.querySelector(
          `.filter-btn[data-type="${type}"][data-value=""]`
        );
        if (allBtn) allBtn.classList.remove("active");

        btn.classList.toggle("active");

        if (btn.classList.contains("active")) {
          if (!activeFilters[type].includes(value)) {
            activeFilters[type].push(value);
          }
        } else {
          activeFilters[type] = activeFilters[type].filter(
            v => v !== value
          );
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

/* ===================== RESET ===================== */
resetFilterBtn.addEventListener("click", resetFilters);

function resetFilters() {
  activeFilters = {
    position: [],
    element: [],
    class: []
  };

  searchInput.value = "";

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("active");
    if (btn.dataset.value === "") {
      btn.classList.add("active");
    }
  });

  resetFilterBtn.style.display = "none";
  renderCharacters();
}

function toggleResetButton() {
  const active =
    activeFilters.position.length ||
    activeFilters.element.length ||
    activeFilters.class.length ||
    searchInput.value.trim().length;

  resetFilterBtn.style.display = active ? "block" : "none";
}

/* ===================== RENDER CHARACTERS ===================== */
function renderCharacters() {
  charsEl.innerHTML = "";

  characters
    .filter(c => {
      return (
        (!activeFilters.position.length ||
          activeFilters.position.includes(c.position)) &&
        (!activeFilters.element.length ||
          activeFilters.element.includes(c.element)) &&
        (!activeFilters.class.length ||
          activeFilters.class.includes(c.class)) &&
        c.name
          .toLowerCase()
          .includes(searchInput.value.toLowerCase())
      );
    })
    .forEach(c => {
      const card = document.createElement("div");
      card.className = "card";

      if (team.some(t => t.name === c.name)) {
        card.classList.add("in-team");
      }

      card.innerHTML = `
        <img src="${c.image}" alt="${c.name}">
        <strong>${c.name}</strong>
        <span>${c.element} • ${c.class} • ${c.position}</span>
      `;

      card.addEventListener("click", () => addToTeam(c));
      charsEl.appendChild(card);
    });
}

/* ===================== TEAM ===================== */
function addToTeam(character) {
  if (team.some(t => t.name === character.name)) return;
  if (team.length >= MAX_TEAM) {
    alert("Max 5 characters");
    return;
  }

  team.push(character);
  persist();
  updateURL();
  renderTeam();
}

function removeFromTeam(name) {
  team = team.filter(t => t.name !== name);
  persist();
  updateURL();
  renderTeam();
}

function renderTeam() {
  teamEl.innerHTML = "";

  for (let i = 0; i < MAX_TEAM; i++) {
    if (team[i]) {
      const card = document.createElement("div");
      card.className = "team-card";

      card.innerHTML = `
        <img src="${team[i].image}" alt="${team[i].name}">
        <strong>${team[i].name}</strong>
      `;

      card.addEventListener("click", () =>
        removeFromTeam(team[i].name)
      );

      teamEl.appendChild(card);
    } else {
      const slot = document.createElement("div");
      slot.className = "team-slot";
      teamEl.appendChild(slot);
    }
  }

  renderCharacters();
}

/* ===================== PERSIST ===================== */
function persist() {
  localStorage.setItem("team", JSON.stringify(team));
}

function loadFromURLorStorage() {
  const params = new URLSearchParams(window.location.search);
  const teamParam = params.get("team");

  if (teamParam) {
    team = teamParam
      .split(",")
      .map(name =>
        characters.find(c => c.name === decodeURIComponent(name))
      )
      .filter(Boolean);
    return;
  }

  const saved = localStorage.getItem("team");
  if (saved) {
    team = JSON.parse(saved);
  }
}

/* ===================== SHARE ===================== */
function updateURL() {
  const names = team
    .map(t => encodeURIComponent(t.name))
    .join(",");

  const newURL = names
    ? `?team=${names}`
    : window.location.pathname;

  history.replaceState(null, "", newURL);
}

shareBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(window.location.href);
  alert("Link copied!");
});
