// ===================== CONFIG ===================== const FALLBACK_IMG = "https://via.placeholder.com/300x200?text=No+Image"; const MAX_TEAM = 5;

// ===================== STATE ===================== let characters = []; let team = [];

let activeFilters = { position: [], element: [], class: [] };

// ===================== ELEMENTS ===================== const charsEl = document.getElementById("characters"); const teamEl = document.getElementById("team"); const shareBtn = document.getElementById("shareBtn"); const searchInput = document.getElementById("searchInput"); const filtersBar = document.querySelector(".filters-bar");

// ===================== RESET FILTER BUTTON ===================== const resetFilterBtn = document.createElement("button"); resetFilterBtn.id = "resetFilterBtn"; resetFilterBtn.textContent = "RESET FILTER"; resetFilterBtn.style.display = "none"; filtersBar.appendChild(resetFilterBtn);

// ===================== LOAD DATA ===================== fetch("data/characters.json") .then(res => res.json()) .then(data => { characters = data.map(c => ({ ...c, image: c.image?.trim() ? c.image : FALLBACK_IMG }));

loadFromURLorStorage();
setupFilters();
renderCharacters();
renderTeam();

}) .catch(err => console.error("Failed to load characters:", err));

// ===================== FILTER SETUP ===================== function setupFilters() { document.querySelectorAll(".filter-btn").forEach(btn => { btn.addEventListener("click", () => handleFilterClick(btn)); });

searchInput.addEventListener("input", () => { toggleResetButton(); renderCharacters(); }); }

function handleFilterClick(btn) { const { type, value } = btn.dataset;

// ALL button if (value === "") { activeFilters[type] = []; document .querySelectorAll(.filter-btn[data-type="${type}"]) .forEach(b => b.classList.remove("active")); btn.classList.add("active"); } else { document .querySelector(.filter-btn[data-type="${type}"][data-value=""]) ?.classList.remove("active");

btn.classList.toggle("active");

if (btn.classList.contains("active")) {
  if (!activeFilters[type].includes(value)) {
    activeFilters[type].push(value);
  }
} else {
  activeFilters[type] = activeFilters[type].filter(v => v !== value);
}

}

toggleResetButton(); renderCharacters(); }

// ===================== RESET FILTER ===================== resetFilterBtn.onclick = () => { activeFilters = { position: [], element: [], class: [] }; searchInput.value = "";

document.querySelectorAll(".filter-btn").forEach(btn => { btn.classList.remove("active"); if (btn.dataset.value === "") btn.classList.add("active"); });

resetFilterBtn.style.display = "none"; renderCharacters(); };

function toggleResetButton() { const active = activeFilters.position.length || activeFilters.element.length || activeFilters.class.length || searchInput.value.trim();

resetFilterBtn.style.display = active ? "block" : "none"; }

// ===================== RENDER CHARACTERS ===================== function renderCharacters() { charsEl.innerHTML = "";

characters .filter(c => (!activeFilters.position.length || activeFilters.position.includes(c.position)) && (!activeFilters.element.length || activeFilters.element.includes(c.element)) && (!activeFilters.class.length || activeFilters.class.includes(c.class)) && c.name.toLowerCase().includes(searchInput.value.toLowerCase()) ) .forEach(c => { const card = document.createElement("div"); card.className = "card"; if (team.some(t => t.name === c.name)) card.classList.add("in-team");

card.innerHTML = `
    <img src="${c.image}" alt="${c.name}">
    <strong>${c.name}</strong>
    <span>${c.element} • ${c.class} • ${c.position}</span>
  `;

  card.onclick = () => addToTeam(c);
  charsEl.appendChild(card);
});

}

// ===================== TEAM ===================== function addToTeam(char) { if (team.some(t => t.name === char.name)) return; if (team.length >= MAX_TEAM) return alert("Max 5 characters");

team.push(char); persist(); updateURL(); renderTeam(); }

function removeFromTeam(name) { team = team.filter(t => t.name !== name); persist(); updateURL(); renderTeam(); }

function renderTeam() { teamEl.innerHTML = "";

for (let i = 0; i < MAX_TEAM; i++) { if (team[i]) { const card = document.createElement("div"); card.className = "team-card"; card.innerHTML = <img src="${team[i].image}" alt="${team[i].name}"> <strong>${team[i].name}</strong>; card.onclick = () => removeFromTeam(team[i].name); teamEl.appendChild(card); } else { const slot = document.createElement("div"); slot.className = "team-slot"; teamEl.appendChild(slot); } }

renderCharacters(); }

// ===================== PERSIST & SHARE ===================== function persist() { localStorage.setItem("team", JSON.stringify(team)); }

function updateURL() { const names = team.map(t => encodeURIComponent(t.name)).join(","); history.replaceState( null, "", names ? ?team=${names} : location.pathname ); }

shareBtn.onclick = () => { navigator.clipboard.writeText(location.href); alert("Link copied!"); };

// ===================== LOAD FROM URL / STORAGE ===================== function loadFromURLorStorage() { const param = new URLSearchParams(location.search).get("team");

if (param) { team = param .split(",") .map(decodeURIComponent) .map(name => characters.find(c => c.name === name)) .filter(Boolean); return; }

const saved = localStorage.getItem("team"); if (saved) team = JSON.parse(saved); }
