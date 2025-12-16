/* =======================
   STATE
======================= */
let characters = [];
let team = [];

let activeFilters = {
  position: "",
  element: "",
  class: ""
};

/* =======================
   ELEMENTS
======================= */
const charsEl = document.getElementById("characters");
const teamEl = document.getElementById("team");
const shareBtn = document.getElementById("shareBtn");
const searchInput = document.getElementById("searchInput");

const FALLBACK_IMG = "https://via.placeholder.com/300x200?text=No+Image";

/* =======================
   PERSIST
======================= */
function persist() {
  localStorage.setItem("team", JSON.stringify(team));
}

/* =======================
   LOAD DATA
======================= */
fetch("data/characters.json")
  .then(r => r.json())
  .then(data => {
    characters = data.map(c => ({
      ...c,
      image: c.image && c.image.trim() ? c.image : FALLBACK_IMG
    }));

    loadFromURLorStorage();
    setupFilters();
    renderCharacters();
    renderTeam();
  });

/* =======================
   FILTER BUTTONS
======================= */
function setupFilters() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      const value = btn.dataset.value;

      document
        .querySelectorAll(`.filter-btn[data-type="${type}"]`)
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");
      activeFilters[type] = value;

      renderCharacters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", renderCharacters);
  }
}

/* =======================
   RENDER CHARACTERS
======================= */
function renderCharacters() {
  charsEl.innerHTML = "";

  characters
    .filter(c =>
      (!activeFilters.position || c.position === activeFilters.position) &&
      (!activeFilters.element || c.element === activeFilters.element) &&
      (!activeFilters.class || c.class === activeFilters.class) &&
      (!searchInput.value ||
        c.name.toLowerCase().includes(searchInput.value.toLowerCase()))
    )
    .forEach(c => {
      const d = document.createElement("div");
      d.className = "card";

      if (team.some(t => t.name === c.name)) {
        d.classList.add("in-team");
      }

      d.innerHTML = `
        <img src="${c.image}">
        <strong>${c.name}</strong>
        <span>${c.element} • ${c.class} • ${c.position}</span>
      `;

      d.addEventListener("click", () => addToTeam(c));

      charsEl.appendChild(d);
    });
}

/* =======================
   TEAM LOGIC
======================= */
function addToTeam(c) {
  if (team.some(t => t.name === c.name)) return;

  if (team.length >= 5) {
    alert("Max 5 characters");
    return;
  }

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

  team.forEach(c => {
    const d = document.createElement("div");
    d.className = "card";

    d.innerHTML = `
      <img src="${c.image}">
      <strong>${c.name}</strong>
    `;

    d.addEventListener("click", () => removeFromTeam(c.name));

    teamEl.appendChild(d);
  });

  renderCharacters();
}

/* =======================
   SHARE LINK
======================= */
function updateURL() {
  const names = team.map(t => encodeURIComponent(t.name)).join(",");
  history.replaceState(
    null,
    "",
    names ? `?team=${names}` : location.pathname
  );
}

shareBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(location.href);
  alert("Link copied!");
});

/* =======================
   LOAD FROM URL / STORAGE
======================= */
function loadFromURLorStorage() {
  const p = new URLSearchParams(location.search).get("team");

  if (p) {
    const names = p.split(",").map(decodeURIComponent);
    team = names
      .map(n => characters.find(c => c.name === n))
      .filter(Boolean);
    return;
  }

  const s = localStorage.getItem("team");
  if (s) {
    try {
      team = JSON.parse(s);
    } catch {
      team = [];
    }
  }
}
