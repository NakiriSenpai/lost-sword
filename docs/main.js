let characters = [];
let team = [];

let activeFilters = {
  position: [],
  element: [],
  class: []
};

const charsEl = document.getElementById("characters");
const teamEl = document.getElementById("team");
const shareBtn = document.getElementById("shareBtn");
const searchInput = document.getElementById("searchInput");
const filtersUI = document.querySelector(".filters-ui");

const FALLBACK_IMG = "https://via.placeholder.com/300x200?text=No+Image";

/* RESET BUTTON */
const resetFilterBtn = document.createElement("button");
resetFilterBtn.id = "resetFilterBtn";
resetFilterBtn.textContent = "RESET FILTER";
resetFilterBtn.style.display = "none";
filtersUI.appendChild(resetFilterBtn);

/* LOAD DATA */
fetch("data/characters.json")
  .then(r => r.json())
  .then(data => {
    characters = data.map(c => ({
      ...c,
      image: c.image?.trim() ? c.image : FALLBACK_IMG
    }));

    loadFromURLorStorage();
    setupFilters();
    renderCharacters();
    renderTeam();
  });

/* FILTER LOGIC (MULTI SELECT) */
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

/* RESET */
resetFilterBtn.onclick = () => {
  activeFilters.position = [];
  activeFilters.element = [];
  activeFilters.class = [];
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

/* RENDER CHARACTERS */
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
      const d = document.createElement("div");
      d.className = "card";
      if (team.some(t => t.name === c.name)) d.classList.add("in-team");

      d.innerHTML = `
        <img src="${c.image}">
        <strong>${c.name}</strong>
        <span>${c.element} • ${c.class} • ${c.position}</span>
      `;

      d.onclick = () => addToTeam(c);
      charsEl.appendChild(d);
    });
}

/* TEAM */
function addToTeam(c) {
  if (team.some(t => t.name === c.name)) return;
  if (team.length >= 5) return alert("Max 5 characters");
  team.push(c);
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
  for (let i = 0; i < 5; i++) {
    if (team[i]) {
      const d = document.createElement("div");
      d.className = "team-card";
      d.innerHTML = `<img src="${team[i].image}"><strong>${team[i].name}</strong>`;
      d.onclick = () => removeFromTeam(team[i].name);
      teamEl.appendChild(d);
    } else {
      teamEl.appendChild(document.createElement("div")).className = "team-slot";
    }
  }
  renderCharacters();
}

/* PERSIST + SHARE */
function persist() {
  localStorage.setItem("team", JSON.stringify(team));
}

function updateURL() {
  const names = team.map(t => encodeURIComponent(t.name)).join(",");
  history.replaceState(null, "", names ? `?team=${names}` : location.pathname);
}

shareBtn.onclick = () => {
  navigator.clipboard.writeText(location.href);
  alert("Link copied!");
};

function loadFromURLorStorage() {
  const p = new URLSearchParams(location.search).get("team");
  if (p) {
    team = p.split(",").map(decodeURIComponent)
      .map(n => characters.find(c => c.name === n))
      .filter(Boolean);
    return;
  }
  const s = localStorage.getItem("team");
  if (s) team = JSON.parse(s);
}
