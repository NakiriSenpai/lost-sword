"use strict";

/* ================= CONSTANT ================= */
const MAX_TEAM = 5;
const FALLBACK_IMG =
  "https://via.placeholder.com/300x200?text=No+Image";

/* ================= STATE ================= */
/* ================= EQUIP STATE ================= */
const EQUIP_TYPES = ["weapon", "armor", "acc", "rune"];


/* ================= EQUIP DATA ================= */
const equipData = {
  weapon: [],
  armor: [],
  acc: [],
  rune: []
};

/* ================= EQUIP STATE ================= */
const EQUIP_ROWS = 5;
const EQUIP_COLS = 4;

let equipSlots = Array.from({ length: EQUIP_ROWS }, () =>
  Array(EQUIP_COLS).fill(null)
);

const MAX_PETS = 3;

let pets = [];
let petSlots = Array(MAX_PETS).fill(null);
let activePetSlotIndex = null;

let activeCardSlotIndex = null;

let cards = [];
let cardSlots = Array(MAX_TEAM).fill(null);

let characters = [];
let team = Array(MAX_TEAM).fill(null);
let selectedSlotIndex = null;

let activeFilters = {
  position: [],
  element: [],
  class: []
};

/* ================= DOM ================= */
const equipGridEl = document.getElementById("equipGrid");
const equipPopupEl = document.getElementById("equipPopup");
const equipPopupCloseEl = document.getElementById("equipPopupClose");

const petsEl = document.getElementById("pets");
const petPopup = document.getElementById("petPopup");
const closePetPopupBtn = document.getElementById("closePetPopup");
const petListEl = document.getElementById("petList");
const petSearchInput = document.getElementById("petSearchInput");

const cardPopup = document.getElementById("cardPopup");
const closeCardPopupBtn = document.getElementById("closeCardPopup");

const cardListEl = document.getElementById("cardList");
const cardSearchInput = document.getElementById("cardSearchInput");
const charsEl = document.getElementById("characters");

const teamEl = document.getElementById("team");
const shareBtn = document.getElementById("shareBtn");
const searchInput = document.getElementById("searchInput");
const filtersBar = document.querySelector(".filters-bar");

/* ================= RESET FILTER ================= */
const resetFilterBtn = document.createElement("button");
resetFilterBtn.id = "resetFilterBtn";
resetFilterBtn.textContent = "RESET FILTER";
resetFilterBtn.style.display = "none";
filtersBar.appendChild(resetFilterBtn);

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  /* ===== FETCH CHARACTERS (EXISTING) ===== */
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
    });

  /* ===== FETCH CARDS (NEW) ===== */
  fetch("data/cards.json")
  .then(r => r.json())
  .then(data => {
    cards = data.map(c => ({
      id: c.id,
      name: c.name,
      image: c.img?.trim() ? c.img : FALLBACK_IMG
    }));
    loadCardsFromStorage();
    renderTeam();
    renderCardList();
  });

  fetch("data/pets.json")
  .then(r => r.json())
  .then(data => {
    pets = data.map(p => ({
      id: p.id,
      name: p.name,
      image: p.image || p.img || FALLBACK_IMG
    }));
    loadPetsFromStorage();
    renderPets();
    renderPetList();
  });

  async function fetchEquipData() {
  const files = {
    weapon: "data/weapon.json",
    armor: "data/armor.json",
    acc: "data/acc.json",
    rune: "data/rune.json"
  };

  for (const type in files) {
    try {
      const res = await fetch(files[type]);
      equipData[type] = await res.json();
    } catch (err) {
      console.error(`Failed to load ${type}`, err);
    }
  }
  }
  
  // renderEquipSlots();
  fetchEquipData();
  // EQUIP POPUP CLOSE
  equipPopupCloseEl.addEventListener("click", closeEquipPopup);
  // close popup when clicking overlay
  equipPopupEl.addEventListener("click", (e) => {
    if (e.target === equipPopupEl) {
      closeEquipPopup();
    }
  });
});

/* ================= FILTER ================= */
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
          activeFilters[type] =
            activeFilters[type].filter(v => v !== value);
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

function toggleResetButton() {
  resetFilterBtn.style.display =
    activeFilters.position.length ||
    activeFilters.element.length ||
    activeFilters.class.length ||
    searchInput.value.trim()
      ? "block"
      : "none";
}

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

/* ================= CHARACTER LIST ================= */
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
      const card = document.createElement("div");
      card.className = "card";

      if (team.some(t => t?.name === c.name)) {
        card.classList.add("in-team");
      }

      card.innerHTML = `
        <img src="${c.image}">
        <strong>${c.name}</strong>
        <span>${c.element} • ${c.class} • ${c.position}</span>
      `;

      card.onclick = () => onCharacterClick(c);
      charsEl.appendChild(card);
    });
}

/* ============ RENDER CARDLIST ======== */
function renderCardList() {
  const keyword = cardSearchInput.value.toLowerCase();
  cardListEl.innerHTML = "";

  cards
    .filter(c => c.name.toLowerCase().includes(keyword))
    .forEach(card => {
      const el = document.createElement("div");
      el.className = "card-item";

      el.innerHTML = `
        <img src="${card.image}">
        <strong>${card.name}</strong>
      `;

      const used = isCardUsed(card.id);

el.classList.toggle("used", used);

el.onclick = () => {
  if (used) return;
  if (activeCardSlotIndex === null) return;

  cardSlots[activeCardSlotIndex] = card;

  persistCards();       // simpan dulu
  renderTeam();         // update slot
  renderCardList();     // 🔥 PENTING: update status used

  closeCardPopup();
};

      cardListEl.appendChild(el);
    });
}

/* ======= RENDER PETS ====== */
function renderPets() {
  petsEl.innerHTML = "";

  for (let i = 0; i < MAX_PETS; i++) {
    const slot = document.createElement("div");
    slot.className = "card-slot";
    slot.dataset.index = i;

    if (petSlots[i]) {
      slot.innerHTML = `
        <button class="remove-card">✕</button>
        <img src="${petSlots[i].image}">
        <strong>${petSlots[i].name}</strong>
      `;

      slot.querySelector(".remove-card").onclick = (e) => {
        e.stopPropagation();
        petSlots[i] = null;
        persistPets();
        renderPets();
        renderPetList(); // 🔥 penting
      };
    } else {
      slot.classList.add("empty");
    }

    slot.onclick = () => openPetPopup(i);
    petsEl.appendChild(slot);
  }
}

/* =========== RENDER PETLIST POPUP ========= */
function renderPetList() {
  const keyword = petSearchInput.value.toLowerCase();
  petListEl.innerHTML = "";

  pets
    .filter(p => p.name.toLowerCase().includes(keyword))
    .forEach(pet => {
      const el = document.createElement("div");
      el.className = "card-item";

      const used = isPetUsed(pet.id);
      el.classList.toggle("used", used);

      el.innerHTML = `
        <img src="${pet.image}">
        <strong>${pet.name}</strong>
      `;

      el.onclick = () => {
        if (used) return;
        if (activePetSlotIndex === null) return;

        petSlots[activePetSlotIndex] = pet;
        persistPets();
        renderPets();
        renderPetList(); // 🔥 update status used
        closePetPopup();
      };

      petListEl.appendChild(el);
    });
}


/* ================= CHARACTER CLICK ================= */
function onCharacterClick(character) {
  // REMOVE JIKA SUDAH ADA
  const existIndex = team.findIndex(
    t => t && t.name === character.name
  );

  if (existIndex !== -1) {
    team[existIndex] = null;
    clearSelectedSlot();
    saveAndRender();
    return;
  }
if (selectedSlotIndex !== null) {
    team[selectedSlotIndex] = character;
    clearSelectedSlot();
    saveAndRender();
    return;
  }

  // INSERT KE SLOT KOSONG PERTAMA
  const emptyIndex = team.findIndex(t => t === null);
  if (emptyIndex === -1) {
    alert("Max 5 characters");
    return;
  }

  team[emptyIndex] = character;
  saveAndRender();
}

/* ================= TEAM ================= */
function renderTeam() {
  teamEl.innerHTML = "";

  for (let i = 0; i < MAX_TEAM; i++) {
    const pair = document.createElement("div");
    pair.className = "team-pair";

    /* ===== TEAM SLOT (EXISTING LOGIC) ===== */
    const slot = document.createElement("div");
    slot.dataset.index = i;

    if (team[i]) {
      slot.className = "team-card";
      slot.innerHTML = `
        <img src="${team[i].image}">
        <strong>${team[i].name}</strong>
      `;
      slot.onclick = () => {
        team[i] = null;
        clearSelectedSlot();
        saveAndRender();
      };
    } else {
      slot.className = "team-slot";
      slot.onclick = () => selectSlot(i, slot);
    }

    /* ===== CARD SLOT ===== */
    const cardSlot = document.createElement("div");
cardSlot.dataset.index = i;

if (cardSlots[i]) {
  cardSlot.className = "card-slot";
  cardSlot.innerHTML = `
  <button class="remove-card">✕</button>
  <img src="${cardSlots[i].image}">
  <strong>${cardSlots[i].name}</strong>
`;
  const removeBtn = cardSlot.querySelector(".remove-card");
removeBtn.onclick = (e) => {
  e.stopPropagation();
  cardSlots[i] = null;

  persistCards();
  renderTeam();
  renderCardList();   // 🔥 bikin kartu aktif lagi di popup
};
} else {
  cardSlot.className = "card-slot empty";
}

cardSlot.onclick = () => {
  openCardPopup(i);
};

    /* ===== APPEND ===== */
    pair.appendChild(slot);
    pair.appendChild(cardSlot);
    teamEl.appendChild(pair);
  }

  renderSynergyWarning();
  renderCharacters();
  renderPets();
}

function selectSlot(index, el) {
  clearSelectedSlot();
  selectedSlotIndex = index;
  el.classList.add("selected-slot");
}

function clearSelectedSlot() {
  selectedSlotIndex = null;
  document
    .querySelectorAll(".selected-slot")
    .forEach(el => el.classList.remove("selected-slot"));
}

/* ================= SYNERGY WARNING ================= */
let synergyWarningEls = [];

function renderSynergyWarning() {
  synergyWarningEls.forEach(el => el.remove());
  synergyWarningEls = [];

  const activeTeam = team.filter(Boolean);
  if (!activeTeam.length) return;
  if (activeTeam.some(c => c.name === "Claire")) return;

  const classes = activeTeam.map(c => c.class);
  const hasKnight = classes.includes("Knight");
  const hasHealer = classes.includes("Healer");

  const warnings = [];

  if (classes.every(c => c === "Wizard" || c === "Archer")) {
    warnings.push("Tidak ada sustain");
    warnings.push("Tidak ada frontline");
  } else {
    if (
      classes.every(c =>
        ["Knight", "Wizard", "Archer"].includes(c)
      ) &&
      !hasHealer
    ) {
      warnings.push("Tidak ada sustain");
    }
    if (
      classes.every(c =>
        ["Wizard", "Archer", "Healer"].includes(c)
      ) &&
      !hasKnight
    ) {
      warnings.push("Tidak ada frontline");
    }
  }

  if (!warnings.length) return;

  const filtersUI = document.querySelector(".filters-ui");
  warnings.forEach(text => {
    const box = document.createElement("div");
    box.className = "synergy-warning";
    box.textContent = "⚠ " + text;
    filtersUI.parentNode.insertBefore(box, filtersUI);
    synergyWarningEls.push(box);
  });
}

/* ============ Close Popup ============ */
function openCardPopup(index) {
  activeCardSlotIndex = index;

  document.querySelectorAll(".card-slot").forEach((slot, i) => {
    slot.classList.toggle("active", i === index);
  });

  cardPopup.classList.add("show");
}

function closeCardPopup() {
  cardPopup.classList.remove("show");
  activeCardSlotIndex = null;

  document.querySelectorAll(".card-slot").forEach(slot => {
    slot.classList.remove("active");
  });
}

/* ======= OPEN CLOSE POPUP PETS ====== */
function openPetPopup(index) {
  activePetSlotIndex = index;
  renderPetList();            // 🔥 INI YANG HILANG
  petPopup.classList.add("show");
}

function closePetPopup() {
  petPopup.classList.remove("show");
  activePetSlotIndex = null;
  petSearchInput.value = "";
}

closePetPopupBtn.onclick = closePetPopup;
petPopup.onclick = (e) => {
  if (e.target === petPopup) closePetPopup();
};

petSearchInput.oninput = renderPetList;

/* ================= RENDER EQUIP ================= */
function renderEquipSlots() {
  if (!equipGridEl) return;

  equipGridEl.innerHTML = "";

  for (let col = 0; col < 4; col++) {
    const rowEl = document.createElement("div");
    rowEl.className = "equip-row";

    for (let row = 0; row < 5; row++) {
      const slot = document.createElement("div");
      slot.className = "equip-slot";

      slot.dataset.row = row;
      slot.dataset.col = col;

      // 🔥 TAMPILKAN EQUIP JIKA ADA
      const equip = equipSlots[row][col];
      if (equip) {
        const imgSrc =
          equip.image ||
          equip.img ||
          equip.icon ||
          "https://via.placeholder.com/48";

        slot.innerHTML = `<img src="${imgSrc}">`;
      }

      slot.addEventListener("click", () => {
        openEquipPopup(row, col);
      });

      rowEl.appendChild(slot);
    }

    equipGridEl.appendChild(rowEl);
  }
}

/* ========== SAVE RENDER CARD SLOT ======= */
function saveAndRenderCards() {
  persistCards();
  renderTeam();
}

/* ======== HELPER FUNCTION ======= */
function isCardUsed(cardId) {
  return cardSlots.some(c => c && c.id === cardId);
}

function isPetUsed(petId) {
  return petSlots.some(p => p && p.id === petId);
}

/* ================= STORAGE ================= */
function saveAndRender() {
  persist();
  updateURL();
  renderTeam();
}

function persist() {
  localStorage.setItem("team", JSON.stringify(team));
}

function loadFromURLorStorage() {
  const p = new URLSearchParams(location.search).get("team");
  if (!p) return;

  p.split(",")
    .map(decodeURIComponent)
    .forEach((name, i) => {
      const c = characters.find(x => x.name === name);
      if (c && i < MAX_TEAM) team[i] = c;
    });
}

function persistCards() {
  localStorage.setItem("cardSlots", JSON.stringify(cardSlots));
}

function loadCardsFromStorage() {
  const saved = JSON.parse(localStorage.getItem("cardSlots"));
  if (Array.isArray(saved)) {
    cardSlots = saved;
  }
}

function persistPets() {
  localStorage.setItem("petSlots", JSON.stringify(petSlots));
}

function loadPetsFromStorage() {
  const saved = JSON.parse(localStorage.getItem("petSlots"));
  if (Array.isArray(saved)) petSlots = saved;
}

function updateURL() {
  const names = team
    .filter(Boolean)
    .map(c => encodeURIComponent(c.name))
    .join(",");
  history.replaceState(
    null,
    "",
    names ? "?team=" + names : location.pathname
  );
}

shareBtn.onclick = () => {
  navigator.clipboard.writeText(location.href);
  alert("Link copied!");
};

/* ============== CARD POPUP EVENT ========= */
closeCardPopupBtn.onclick = closeCardPopup;

cardPopup.onclick = (e) => {
  if (e.target === cardPopup) {
    closeCardPopup();
  }
};

/* ======== SEARCH CARD IN POPUP ======= */
cardSearchInput.oninput = renderCardList;

/* ================= EQUIP POPUP ================= */
let activeEquipSlot = null;

function openEquipPopup(row, col) {
  activeEquipSlot = { row, col };
  renderEquipPopupContent(col);
  equipPopupEl.classList.remove("hidden");
}

function closeEquipPopup() {
  equipPopupEl.classList.add("hidden");
  activeEquipSlot = null;
}

/* ========= RENDER EQUIP POPUP CONTENT ===== */
function renderEquipPopupContent(col) {
  const body = equipPopupEl.querySelector(".equip-popup-body");
  body.innerHTML = "";

  const type = EQUIP_TYPES[col];
  const list = equipData[type] || [];

  const grid = document.createElement("div");
  grid.className = "equip-popup-grid";

  list.forEach(item => {
  const card = document.createElement("div");
  card.className = "equip-popup-card";

  const img = document.createElement("img");

  const imgSrc =
    item.image ||
    item.img ||
    item.icon ||
    "https://via.placeholder.com/64?text=No+Img";

  img.src = imgSrc;
  img.alt = item.name || "";
  img.className = "equip-popup-item";

  card.onclick = () => {
    if (!activeEquipSlot) return;

    const { row, col } = activeEquipSlot;
    equipSlots[row][col] = item;

    renderEquipSlots();
    closeEquipPopup();
  };

  card.appendChild(img);
  grid.appendChild(card);
});

  body.appendChild(grid);
}
