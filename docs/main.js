let characters = [];
let team = [];

let activeFilters = {
  position: [],
  element: [],
  class: []
};

const charsEl = document.getElementById("characters");
const teamEl = document.getElementById("team");
const searchInput = document.getElementById("searchInput");
const filtersUI = document.querySelector(".filters-ui");

/* ================= FIX LAYOUT STRUCTURE ================= */
const filtersBar = document.createElement("div");
filtersBar.className = "filters-bar";

/* PINDAHKAN SEMUA filter-row KE filters-bar */
document.querySelectorAll(".filter-row").forEach(row => {
  filtersBar.appendChild(row);
});

/* RESET BUTTON */
const resetFilterBtn = document.createElement("button");
resetFilterBtn.id = "resetFilterBtn";
resetFilterBtn.textContent = "RESET FILTER";
resetFilterBtn.style.display = "none";
filtersBar.appendChild(resetFilterBtn);

/* MASUKKAN KE filters-ui */
filtersUI.appendChild(filtersBar);

/* ================= LOAD DATA ================= */
fetch("data/characters.json")
  .then(r => r.json())
  .then(data => {
    characters = data;
    setupFilters();
    renderCharacters();
    renderTeam();
  });

/* ================= FILTER LOGIC ================= */
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

      toggleReset();
      renderCharacters();
    });
  });

  searchInput.addEventListener("input", () => {
    toggleReset();
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

function toggleReset() {
  const active =
    activeFilters.position.length ||
    activeFilters.element.length ||
    activeFilters.class.length ||
    searchInput.value.trim();

  resetFilterBtn.style.display = active ? "block" : "none";
}

/* ================= RENDER ================= */
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
      d.innerHTML = `<img src="${c.image}"><strong>${c.name}</strong>`;
      d.onclick = () => addToTeam(c);
      charsEl.appendChild(d);
    });
}

/* ================= TEAM ================= */
function addToTeam(c) {
  if (team.some(t => t.name === c.name)) return;
  if (team.length >= 5) return alert("Max 5 characters");
  team.push(c);
  renderTeam();
}

function renderTeam() {
  teamEl.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    if (team[i]) {
      const d = document.createElement("div");
      d.className = "team-card";
      d.textContent = team[i].name;
      d.onclick = () => {
        team = team.filter(t => t !== team[i]);
        renderTeam();
      };
      teamEl.appendChild(d);
    } else {
      teamEl.appendChild(document.createElement("div")).className = "team-slot";
    }
  }
  }
