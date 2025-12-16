/* ================= GLOBAL STATE ================= */

let characters = [];
let team = [];
let cards = [];
let activeTeamIndex = null;

let activeFilters = {
  position: [],
  element: [],
  class: []
};

const FALLBACK_IMG =
  "https://via.placeholder.com/300x200?text=No+Image";
const FALLBACK_CARD =
  "https://via.placeholder.com/80x80?text=Card";

/* ================= DOM ================= */

const charsEl = document.getElementById("characters");
const teamEl = document.getElementById("team");
const shareBtn = document.getElementById("shareBtn");
const searchInput = document.getElementById("searchInput");
const filtersUI = document.querySelector(".filters-ui");

/* ================= RESET BUTTON ================= */

const resetFilterBtn = document.createElement("button");
resetFilterBtn.id = "resetFilterBtn";
resetFilterBtn.textContent = "RESET FILTER";
resetFilterBtn.style.display = "none";
filtersUI.appendChild(resetFilterBtn);

/* ================= LOAD DATA ================= */
Promise.all([
  fetch("data/characters.json"),
  fetch("data/cards.json")
])
  .then(responses => Promise.all(responses.map(r => r.json())))
  .then(([charData, cardData]) => {
    characters = charData.map(c => ({
      ...c,
      image: c.image?.trim() ? c.image : FALLBACK_IMG
    }));

    cards = cardData.map(c => ({
      ...c,
      img: c.img?.trim() ? c.img : FALLBACK_CARD
    }));

    // 🔍 DEBUG (TAMBAHKAN DI SINI)
    console.log("CHARACTERS:", characters);
    console.log("CARDS:", cards);
    document.body.insertAdjacentHTML(
  "beforeend",
  `<pre style="
    position:fixed;
    bottom:0;
    left:0;
    right:0;
    max-height:40%;
    overflow:auto;
    background:#000;
    color:#0f0;
    font-size:12px;
    z-index:9999;
  ">
CHARACTERS: ${JSON.stringify(characters.slice(0,2), null, 2)}

CARDS: ${JSON.stringify(cards.slice(0,2), null, 2)}
</pre>`
);

    loadFromURLorStorage();
    setupFilters();
    renderCharacters();
    renderTeam();
  })
  .catch(err => {
    console.error("FETCH ERROR:", err);
  });

/* ================= FILTER LOGIC ================= */

function setupFilters() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.onclick = () => {
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
    };
  });

  searchInput.oninput = () => {
    toggleResetButton();
    renderCharacters();
  };
}

/* ================= RESET ================= */

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

/* ================= RENDER CHARACTERS ================= */

function renderCharacters() {
  charsEl.innerHTML = "";

  characters
    .filter(c =>
      (!activeFilters.position.length ||
        activeFilters.position.includes(c.position)) &&
      (!activeFilters.element.length ||
        activeFilters.element.includes(c.element)) &&
      (!activeFilters.class.length ||
        activeFilters.class.includes(c.class)) &&
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

/* ================= TEAM ================= */

function addToTeam(c) {
  if (team.some(t => t.name === c.name)) return;
  if (team.length >= 5) return alert("Max 5 characters");

  team.push({ ...c, card: null });
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
      d.innerHTML = `
        <img src="${team[i].image}">
        <strong>${team[i].name}</strong>

        <div class="card-slot" data-index="${i}">
          ${
            team[i].card
              ? `<img src="${team[i].card.img}">`
              : `<span>+</span>`
          }
        </div>
      `;

      d.onclick = () => removeFromTeam(team[i].name);

      d.querySelector(".card-slot").onclick = e => {
        e.stopPropagation();
        openCardPopup(i);
      };

      teamEl.appendChild(d);
    } else {
      teamEl.appendChild(document.createElement("div")).className = "team-slot";
    }
  }

  renderCharacters();
}

/* ================= PERSIST + SHARE ================= */

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
    team = p
      .split(",")
      .map(decodeURIComponent)
      .map(n => characters.find(c => c.name === n))
      .filter(Boolean)
      .map(c => ({ ...c, card: null }));
    return;
  }

  const s = localStorage.getItem("team");
  if (s) team = JSON.parse(s);
}

/* ================= CARD POPUP ================= */

const popup = document.createElement("div");
popup.id = "cardPopup";
popup.className = "popup hidden";
popup.innerHTML = `
  <div class="popup-box">
    <button class="close">✕</button>
    <input id="cardSearch" placeholder="Search card..." />
    <div id="cardList" class="card-grid"></div>
  </div>
`;
document.body.appendChild(popup);

const cardList = popup.querySelector("#cardList");
const cardSearch = popup.querySelector("#cardSearch");

function openCardPopup(index) {
  activeTeamIndex = index;
  cardSearch.value = "";
  popup.classList.remove("hidden");
  renderCardList();
}

popup.querySelector(".close").onclick = () =>
  popup.classList.add("hidden");

cardSearch.oninput = renderCardList;

function renderCardList() {
  cardList.innerHTML = "";

  cards
    .filter(c =>
      c.name.toLowerCase().includes(cardSearch.value.toLowerCase())
    )
    .forEach(c => {
      const d = document.createElement("div");
      d.innerHTML = `
        <img src="${c.img}">
        <small>${c.name}</small>
      `;
      d.onclick = () => selectCard(c);
      cardList.appendChild(d);
    });
}

function selectCard(card) {
  if (activeTeamIndex === null) return;

  team[activeTeamIndex].card = card;
  persist();
  popup.classList.add("hidden");
  renderTeam();
    }
