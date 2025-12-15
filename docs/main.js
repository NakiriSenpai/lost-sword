let characters = [];
let team = [];

const charsEl = document.getElementById("characters");
const teamEl = document.getElementById("team");
const elF = document.getElementById("elementFilter");
const clF = document.getElementById("classFilter");
const shareBtn = document.getElementById("shareBtn");

const FALLBACK_IMG = "https://via.placeholder.com/300x200?text=No+Image";

/* =======================
   PERSIST (WAJIB ADA)
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

    initFilters();
    loadFromURLorStorage();
    renderCharacters();
    renderTeam();
  });

/* =======================
   FILTERS
======================= */
function initFilters() {
  [...new Set(characters.map(c => c.element))]
    .forEach(v => elF.innerHTML += `<option value="${v}">${v}</option>`);

  [...new Set(characters.map(c => c.class))]
    .forEach(v => clF.innerHTML += `<option value="${v}">${v}</option>`);
}

elF.onchange = clF.onchange = renderCharacters;

/* =======================
   RENDER CHARACTERS
======================= */
function renderCharacters() {
  charsEl.innerHTML = "";

  characters
    .filter(c =>
      (!elF.value || c.element === elF.value) &&
      (!clF.value || c.class === clF.value)
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

      d.addEventListener("click", () => {
        addToTeam(c);
      });

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

    d.addEventListener("click", () => {
      removeFromTeam(c.name);
    });

    teamEl.appendChild(d);
  });

  renderCharacters();
}

/* =======================
   SHARE LINK
======================= */
function updateURL() {
  const names = team.map(t => encodeURIComponent(t.name)).join(",");
  history.replaceState(null, "", names ? `?team=${names}` : location.pathname);
}

shareBtn.onclick = () => {
  navigator.clipboard.writeText(location.href);
  alert("Link copied!");
};

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
  if (s) team = JSON.parse(s);
        }
