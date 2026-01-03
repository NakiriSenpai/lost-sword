"use strict";

/* ================= CONSTANT ================= */
const MAX_TEAM = 5;
const FALLBACK_IMG =
  "https://via.placeholder.com/300x200?text=No+Image";

/* ================= STATE ================= */
let savedTeams = JSON.parse(localStorage.getItem("savedTeams")) || [];

let activeEquipSlot = null;
let confirmAction = null;

/* ================= TEAM CATEGORIES ================= */
const TEAM_CATEGORIES = [
  "Story",
  "PvP",
  "Raid",
  "Avalon",
  "Abyss",
  "Star Reincarnation"
];

let selectedCategory = "Story";
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
document.addEventListener("DOMContentLoaded", async () => {
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
  
  await fetchEquipData();
  loadEquipFromURL();
  renderEquipSlots();
  renderSavedTeams();
  updateResetButtonState();
  renderCategoryButtons();
  // EQUIP POPUP CLOSE
  if (equipPopupCloseEl) {
  equipPopupCloseEl.addEventListener("click", closeEquipPopup);
}

if (equipPopupEl) {
  equipPopupEl.addEventListener("click", (e) => {
    if (e.target === equipPopupEl) {
      closeEquipPopup();
    }
  });
}
  /* ================= CONFIRM MODAL EVENTS ================= */
document.getElementById("cancelResetBtn")
  ?.addEventListener("click", closeConfirmModal);

document.getElementById("confirmResetBtn")
  ?.addEventListener("click", () => {
    if (typeof confirmAction === "function") {
      confirmAction();
    }
    closeConfirmModal();
  });

document
  .getElementById("resetConfirmPopup")
  ?.addEventListener("click", (e) => {
    if (e.target.id === "resetConfirmPopup") {
      closeConfirmModal();
    }
  });
  
  /* ========= SAVE BUTTON ========= */
  document.getElementById("save-team-btn")
  ?.addEventListener("click", () => {
    openConfirmModal({
      title: "Save Team?",
      message: `
        Team saat ini akan <strong>disimpan</strong>.<br>
        Kamu masih bisa mengeditnya nanti.
      `,
      confirmText: "💾 Save Team",
      onConfirm: saveCurrentTeam
    });
  });
  
/* ========= RESET TEAM BUTTON ========= */
document.getElementById("reset-team-btn")
  ?.addEventListener("click", () => {
    openConfirmModal({
      title: "Reset Team?",
      message: `
        Semua <strong>Character, Card, Pet, dan Equip</strong>
        akan dikosongkan.<br>
        Aksi ini <strong>tidak bisa dibatalkan</strong>.
      `,
      confirmText: "🔄 Reset Team",
      onConfirm: resetTeam
    });
  });
  
  /* ========== LOGIC PINDAH HALAMAN ======= */
  const navCurrent = document.getElementById("nav-current");
  const navSaved = document.getElementById("nav-saved");

  const pageCurrent = document.getElementById("page-current-team");
  const pageSaved = document.getElementById("page-saved-team");

  if (navCurrent && navSaved) {
  navCurrent.onclick = () => switchPage("current");
  navSaved.onclick = () => switchPage("saved");
}

function switchPage(page) {
  if (!pageCurrent || !pageSaved || !navCurrent || !navSaved) return;

  pageCurrent.classList.remove("active");
  pageSaved.classList.remove("active");
  navCurrent.classList.remove("active");
  navSaved.classList.remove("active");

  const saveBtn = document.getElementById("save-team-btn");
  const resetBtn = document.getElementById("reset-team-btn");

  if (page === "current") {
    pageCurrent.classList.add("active");
    navCurrent.classList.add("active");

    if (saveBtn) saveBtn.style.display = "block";
    if (resetBtn) resetBtn.style.display = "block";
  } else {
    pageSaved.classList.add("active");
    navSaved.classList.add("active");

    if (saveBtn) saveBtn.style.display = "none";
    if (resetBtn) resetBtn.style.display = "none";

    renderSavedTeams();
  }
}

// DEVICE POPUP (MOBILE & TABLET TEXT)
const devicePopup = document.getElementById("device-popup");
const closeDevicePopupBtn = document.getElementById("close-device-popup");
const devicePopupText = document.getElementById("device-popup-text");

const width = window.innerWidth;

if (width < 1024) {
  if (width < 768) {
    // MOBILE
    devicePopupText.textContent =
      "Untuk pengalaman terbaik, situs ini direkomendasikan dibuka melalui desktop. Versi mobile masih dalam tahap pengembangan.";
  } else {
    // TABLET
    devicePopupText.textContent =
      "Pengalaman terbaik tersedia pada tampilan desktop. Dukungan tablet sedang disesuaikan.";
  }

  devicePopup.classList.add("show");
}

closeDevicePopupBtn.addEventListener("click", () => {
  devicePopup.classList.remove("show");
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

  // 🔥 TAMBAHKAN BARIS INI
  ensureAllActiveIfEmpty(type);
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

  function ensureAllActiveIfEmpty(type) {
  if (activeFilters[type].length === 0) {
    const allBtn = document.querySelector(
      `.filter-btn[data-type="${type}"][data-value=""]`
    );

    document
      .querySelectorAll(`.filter-btn[data-type="${type}"]`)
      .forEach(b => b.classList.remove("active"));

    allBtn?.classList.add("active");
  }
  }

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
  <img src="${card.image}" alt="${card.name}">
  <div class="card-name" title="${card.name}">
    ${card.name}
  </div>
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
    slot.className = "card-slot pet-slot";
    slot.dataset.index = i;

    if (petSlots[i]) {
      const pet = petSlots[i];

      slot.innerHTML = `
        <button class="remove-pet remove-btn">✕</button>
        <div class="slot-inner">
          <img src="${pet.image}">
          <div class="slot-name">${pet.name}</div>
        </div>
      `;

      const removeBtn = slot.querySelector(".remove-pet");
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        petSlots[i] = null;
        persistPets();
        renderPets();
        renderPetList();
      };
    } else {
      slot.classList.add("empty");
      slot.innerHTML = `
        <div class="slot-inner">
          <span class="slot-empty-text">+ Pets</span>
        </div>
      `;
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
  <img src="${pet.image}" alt="${pet.name}">
  <div class="pet-name" title="${pet.name}">
    ${pet.name}
  </div>
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
  team[existIndex] = null;        // hapus character
  clearWeaponByRow(existIndex);   // 🔥 HAPUS WEAPON SLOT INI
  clearSelectedSlot();
  saveAndRender();
  return;
}
if (selectedSlotIndex !== null) {
  const prevChar = team[selectedSlotIndex]; // 1. simpan char lama
  team[selectedSlotIndex] = character;      // 2. ganti char

  // 3. cek class
  if (!prevChar || prevChar.class !== character.class) {
    clearWeaponByRow(selectedSlotIndex);    // 🔥 HAPUS WEAPON
  }

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

    /* ===== CHARACTER SLOT (TANPA X) ===== */
    const slot = document.createElement("div");
    slot.dataset.index = i;

    if (team[i]) {
      slot.className = "team-card";
      slot.innerHTML = `
        <div class="slot-inner">
          <img src="${team[i].image}">
          <div class="slot-name">${team[i].name}</div>
        </div>
      `;

      // klik slot = remove character
      slot.onclick = () => {
        team[i] = null;
        clearWeaponByRow(i);
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
        <button class="remove-card remove-btn">✕</button>
        <img src="${cardSlots[i].image}">
        <strong>${cardSlots[i].name}</strong>
      `;

      cardSlot.querySelector(".remove-card").onclick = (e) => {
        e.stopPropagation();
        cardSlots[i] = null;
        persistCards();
        renderTeam();
        renderCardList();
      };
    } else {
      cardSlot.className = "card-slot empty";
    }

    cardSlot.onclick = () => openCardPopup(i);

    pair.appendChild(slot);
    pair.appendChild(cardSlot);
    teamEl.appendChild(pair);
  }

  /* ===== POST RENDER ===== */
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

  // Claire = full ignore
  if (activeTeam.some(c => c.name === "Claire")) return;

  const hasNeoBedivere = activeTeam.some(
    c => c.name === "NEO Bedivere"
  );

  // CLASS VIRTUAL
  const classes = activeTeam.map(c => {
    if (c.name === "NEO Bedivere") return "Healer";
    return c.class;
  });

  const hasKnight = classes.includes("Knight");
  const hasHealer = classes.includes("Healer");

  const warnings = [];

  /* ================== NEO BEDIVERE EXCEPTION ================== */
  if (hasNeoBedivere) {
    if (!hasKnight) {
      warnings.push(
        "Kamu belum punya unit frontline (Knight) untuk nahan serangan di tim."
      );
    }
  } 
  /* ================== NORMAL LOGIC ================== */
  else {
    if (classes.every(c => c === "Wizard" || c === "Archer")) {
      warnings.push(
        "Tim kamu belum punya sustain (shield, lifesteal, atau heal)."
      );
      warnings.push(
        "Kamu belum punya unit frontline (Knight) untuk nahan serangan di tim."
      );
    } else {
      if (
        classes.every(c =>
          ["Knight", "Wizard", "Archer"].includes(c)
        ) &&
        !hasHealer
      ) {
        warnings.push(
          "Tim kamu belum punya sustain (shield, lifesteal, atau heal)."
        );
      }

      if (
        classes.every(c =>
          ["Wizard", "Archer", "Healer"].includes(c)
        ) &&
        !hasKnight
      ) {
        warnings.push(
          "Kamu belum punya unit frontline (Knight) untuk nahan serangan di tim."
        );
      }
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

  // 🔥 RESET SEARCH & FORCE RENDER
  cardSearchInput.value = "";
  renderCardList();
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

      const equip = equipSlots[row][col];
      if (equip) {
        const imgSrc =
          equip.image ||
          equip.img ||
          equip.icon ||
          "https://via.placeholder.com/48";

        slot.classList.add("filled");

        slot.innerHTML = `
          <img src="${imgSrc}">
          <button class="remove-equip">✕</button>
        `;

        slot.querySelector(".remove-equip").onclick = (e) => {
          e.stopPropagation();
          equipSlots[row][col] = null;
          saveAndRender();
        };
      }

      slot.addEventListener("click", () => {
        activeEquipSlot = { row, col };
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
  
/* ========= FUNGSI RNDER CATEGORY ======= */
  function renderCategoryButtons() {
  const wrap = document.getElementById("teamCategorySelect");
  if (!wrap) return;

  wrap.innerHTML = "";

  TEAM_CATEGORIES.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;

    if (cat === selectedCategory) {
      btn.style.border = "2px solid gold";
    }

    btn.onclick = () => {
      selectedCategory = cat;
      renderCategoryButtons();
    };

    wrap.appendChild(btn);
  });
  }

/* ========= FUNGSI SAVE TEAM ======= */
function saveCurrentTeam() {
  const titleInput = document.getElementById("teamTitleInput");
  const title = titleInput ? titleInput.value.trim() : "";

  if (!title) {
    alert("Judul team wajib diisi");
    return;
  }

  const snapshot = {
    id: "team_" + Date.now(),
    savedAt: Date.now(),

    title: title,
    category: selectedCategory,

    team: JSON.parse(JSON.stringify(team)),
    cards: JSON.parse(JSON.stringify(cardSlots)),
    pets: JSON.parse(JSON.stringify(petSlots)),
    equips: equipSlots.map(row => row.map(e => e ? e.id : null))
  };

  savedTeams.push(snapshot);
  localStorage.setItem("savedTeams", JSON.stringify(savedTeams));
  renderSavedTeams();
  showToast("Team berhasil disimpan");
}
/* ======== EQUIP IMAGE SAVED ====== */
function getEquipImageById(id) {
  // guard keras
  if (typeof id !== "string") return null;

  if (id.startsWith("wep_")) {
    const w = equipData.weapon.find(x => x.id === id);
    return w?.img || null;
  }

  if (id.startsWith("armor_")) {
    const a = equipData.armor.find(x => x.id === id);
    return a?.img || null;
  }

  if (id.startsWith("acc_")) {
    const a = equipData.acc.find(x => x.id === id);
    return a?.img || null;
  }

  if (id.startsWith("rune_")) {
    const r = equipData.rune.find(x => x.id === id);
    return r?.img || null;
  }

  return null;
}

/* ======== RENDER TEAM SAVED ======*/
function renderSavedTeams() {
  const list = document.getElementById("saved-teams-list");
  if (!list) return;

  list.innerHTML = "";

  if (!Array.isArray(savedTeams) || savedTeams.length === 0) {
    list.innerHTML = "<p>Belum ada team yang disimpan.</p>";
    return;
  }

  savedTeams.forEach(team => {
    /* ===== NORMALIZE DATA ===== */
    team.pets   = Array.isArray(team.pets)   ? team.pets   : [];
    team.team   = Array.isArray(team.team)   ? team.team   : [];
    team.cards  = Array.isArray(team.cards)  ? team.cards  : [];
    team.equips = Array.isArray(team.equips) ? team.equips : [];
    team.note   = typeof team.note === "string" ? team.note : "";

    for (let r = 0; r < 5; r++) {
      if (!Array.isArray(team.equips[r])) team.equips[r] = [];
    }

    const card = document.createElement("div");
    card.className = "saved-team-card";

    /* ===== DATE FORMAT ===== */
    const d = new Date(team.savedAt || Date.now());
    const pad = n => String(n).padStart(2, "0");
    const dateText =
      `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}`;

    let html = `
      <div class="saved-team-header">
      <span class="saved-team-category">
      ${team.category || "Uncategorized"}
    </span>

    <h3 class="saved-team-title">
      ${team.title || "Untitled Team"}
    </h3>
        <div class="saved-team-date">Saved: ${dateText}</div>
        <button class="saved-team-remove">Remove</button>
      </div>

      <div class="saved-team-body">
        <!-- LEFT GRID -->
        <div class="saved-team-grid">
    `;

    /* PETS */
    team.pets.slice(0, 3).forEach((pet, i) => {
      html += `
        <div class="saved-slot saved-pet saved-row-pet saved-col-${i + 2}">
          ${pet ? `<img src="${pet.image}">` : ""}
        </div>`;
    });

    /* CHAR */
    for (let i = 0; i < 5; i++) {
      const c = team.team[i];
      html += `
        <div class="saved-slot saved-char saved-row-char saved-col-${i + 1}">
          ${c ? `<img src="${c.image}">` : ""}
        </div>`;
    }

    /* CARD */
    for (let i = 0; i < 5; i++) {
      const c = team.cards[i];
      html += `
        <div class="saved-slot saved-card saved-row-card saved-col-${i + 1}">
          ${c ? `<img src="${c.image}">` : ""}
        </div>`;
    }

    /* EQUIP */
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 5; row++) {
        const id = team.equips[row][col];
        const img = id ? getEquipImageById(id) : null;
        html += `
          <div class="saved-slot saved-equip saved-row-eq-${col+1} saved-col-${row+1}">
            ${img ? `<img src="${img}">` : ""}
          </div>`;
      }
    }

    html += `
        </div>

        <!-- RIGHT NOTE -->
        <div class="saved-team-note">
          <textarea placeholder="Catatan team...">${team.note}</textarea>
          <button class="save-note">Save Note</button>
        </div>
      </div>
    `;

    card.innerHTML = html;

    /* EVENTS */
    card.querySelector(".saved-team-remove").onclick = () => {
  openConfirmModal({
    title: "Delete Saved Team?",
    message: `
      Team yang sudah disimpan akan <strong>dihapus permanen</strong>.<br>
      Catatan juga ikut terhapus.
    `,
    confirmText: "🗑 Delete",
    onConfirm: () => deleteSavedTeam(team.id)
  });
};

    card.querySelector(".save-note").onclick = () => {
  const textarea = card.querySelector("textarea");
  const text = textarea.value;

  /* ========= VALIDATION (SEBELUM POPUP) ========= */
  const oldText = team.note || "";

  if (text === oldText) {
    showToast("Catatan tidak berubah");
    return;
  }

  if (!text.trim()) {
    showToast("Catatan masih kosong");
    return;
  }

  openConfirmModal({
    title: "Save Note?",
    message: `
      Catatan untuk team ini akan <strong>disimpan</strong>.
    `,
    confirmText: "📝 Save Note",
    confirmType: "primary",
    onConfirm: () => {
      team.note = text;
      localStorage.setItem("savedTeams", JSON.stringify(savedTeams));
      showToast("Catatan sudah disimpan");
    }
  });
};

    list.appendChild(card);
  });
}

/* ======= GENERIC CONFIRM MODAL ====== */
  function openConfirmModal({
  title,
  message,
  confirmText = "Confirm",
  onConfirm
}) {
  const popup = document.getElementById("resetConfirmPopup");
  if (!popup) return;

  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMessage").innerHTML = message;

  const confirmBtn = document.getElementById("confirmResetBtn");
  confirmBtn.textContent = confirmText;

  confirmAction = onConfirm;
  popup.classList.remove("hidden");
  }

  /* ======= OPEN MODAL GWNERIC ======== */
  function openConfirmModal({
  title,
  message,
  confirmText = "Confirm",
  onConfirm
}) {
  const popup = document.getElementById("resetConfirmPopup");
  if (!popup) return;

  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMessage").innerHTML = message;

  const confirmBtn = document.getElementById("confirmResetBtn");
  confirmBtn.textContent = confirmText;

  confirmAction = onConfirm;
  popup.classList.remove("hidden");
  }

  /* ========= CLOSE MODAL ======== */
  function closeConfirmModal() {
  document
    .getElementById("resetConfirmPopup")
    ?.classList.add("hidden");

  confirmAction = null;
  }
  
  /* ======= RESET POPUP ====== */
  const resetPopup = document.getElementById("resetConfirmPopup");
const cancelResetBtn = document.getElementById("cancelResetBtn");
const confirmResetBtn = document.getElementById("confirmResetBtn");

function openResetConfirm() {
  if (!resetPopup) return;
  resetPopup.classList.remove("hidden");
}

function closeResetConfirm() {
  if (!resetPopup) return;
  resetPopup.classList.add("hidden");
}

/* cancel */
cancelResetBtn?.addEventListener("click", closeResetConfirm);

/* click outside */
resetPopup?.addEventListener("click", (e) => {
  if (e.target === resetPopup) {
    closeResetConfirm();
  }
});

/* confirm */
confirmResetBtn?.addEventListener("click", () => {
  closeResetConfirm();
  resetTeam();   // 🔥 pakai logic reset yang sudah ada
});

/* ======== HAPUS SAVED TEAM ====== */
function deleteSavedTeam(teamId) {
  savedTeams = savedTeams.filter(t => t.id !== teamId);
  localStorage.setItem("savedTeams", JSON.stringify(savedTeams));
  renderSavedTeams();

  showToast("Team berhasil dihapus");
}

/* ========= RESET SLOT TEAM ALL ===== */
  function resetTeam() {
  team = Array(MAX_TEAM).fill(null);
  cardSlots = Array(MAX_TEAM).fill(null);
  petSlots = Array(MAX_PETS).fill(null);

  equipSlots = Array.from({ length: EQUIP_ROWS }, () =>
    Array(EQUIP_COLS).fill(null)
  );

  selectedSlotIndex = null;
  activeCardSlotIndex = null;
  activePetSlotIndex = null;
  activeEquipSlot = null;

  localStorage.removeItem("team");
  localStorage.removeItem("cardSlots");
  localStorage.removeItem("petSlots");

  history.replaceState(null, "", location.pathname);

  renderTeam();
  renderCharacters();
  renderPets();
  renderEquipSlots();
  updateResetButtonState();
}

  /* ====== DISABLE RESET TEAM BUTTON IF NULL ===== */
  
function isTeamEmpty() {
  const hasChar = team.some(Boolean);
  const hasCard = cardSlots.some(Boolean);
  const hasPet  = petSlots.some(Boolean);
  const hasEquip = equipSlots.some(row =>
    row.some(e => e !== null)
  );

  return !(hasChar || hasCard || hasPet || hasEquip);
}

  function updateResetButtonState() {
  const btn = document.getElementById("reset-team-btn");
  if (!btn) return;

  btn.disabled = isTeamEmpty();
  }
  
/* ======== HELPER FUNCTION ======= */
function getCharacterClassByRow(row) {
  const char = team[row];
  return char ? char.class.toLowerCase() : null;
}

function isCardUsed(cardId) {
  return cardSlots.some(c => c && c.id === cardId);
}

function isPetUsed(petId) {
  return petSlots.some(p => p && p.id === petId);
}

function encodeEquipToURL() {
  const list = [];

  for (let row = 0; row < EQUIP_ROWS; row++) {
    for (let col = 0; col < EQUIP_COLS; col++) {
      const item = equipSlots[row][col];
      if (!item || !item.id) continue;

      list.push(`${row}-${col}:${item.id}`);
    }
  }

  return list.join("|");
}

function loadEquipFromURL() {
  const params = new URLSearchParams(location.search);
  const equipParam = params.get("e");
  if (!equipParam) return;

  equipParam.split("|").forEach(pair => {
    const [pos, id] = pair.split(":");
    if (!pos || !id) return;

    const [row, col] = pos.split("-").map(Number);
    if (row >= EQUIP_ROWS || col >= EQUIP_COLS) return;

    const type = EQUIP_TYPES[col];
    const list = equipData[type];
    if (!list) return;

    const item = list.find(i => i.id === id);
    if (!item) return;

    // ❗ VALIDASI WEAPON VS CLASS
    if (type === "weapon") {
      const charClass = getCharacterClassByRow(row);
      if (!charClass) return;

      const itemClass = item.class?.toLowerCase();
      if (
        itemClass !== "universal" &&
        itemClass !== charClass
      ) return;
    }

    equipSlots[row][col] = item;
  });
}

function clearWeaponByRow(row) {
  if (!equipSlots[row]) return;

  equipSlots[row][0] = null; // col 0 = weapon
}             

/* ========= POPUP NOTIF SAVE NOTE ======= */
function showToast(message) {
  const toast = document.getElementById("global-toast");
  if (!toast) return;

  toast.querySelector(".toast-content").textContent = message;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2000); // 2 detik
}

/* ================= STORAGE ================= */
function saveAndRender() {
  persist();
  updateURL();
  renderTeam();
  renderEquipSlots(); 
  updateResetButtonState();
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
  const params = new URLSearchParams();

  const names = team
    .filter(Boolean)
    .map(c => encodeURIComponent(c.name))
    .join(",");

  if (names) params.set("team", names);

  const equipStr = encodeEquipToURL();
  if (equipStr) params.set("e", equipStr);

  history.replaceState(
    null,
    "",
    params.toString()
      ? "?" + params.toString()
      : location.pathname
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
  let list = equipData[type] || [];

  let hasCharacter = true;
  let charClass = null;

  /* ===== WEAPON LOGIC ===== */
  if (type === "weapon" && activeEquipSlot) {
    charClass = getCharacterClassByRow(activeEquipSlot.row);
    hasCharacter = !!charClass;

    if (hasCharacter) {
      list = list.filter(item => {
        const itemClass = item.class?.toLowerCase();

        if (itemClass === "universal") {
          return charClass === "wizard" || charClass === "healer";
        }
        return itemClass === charClass;
      });
    }
  }

  /* ===== WARNING ===== */
  if (type === "weapon" && !hasCharacter) {
    const warning = document.createElement("div");
    warning.className = "equip-popup-warning";
    warning.textContent = "⚠ Isi slot character terlebih dahulu";
    body.appendChild(warning);
  }

  const grid = document.createElement("div");
  grid.className = "equip-popup-grid";

  list.forEach(item => {
    const card = document.createElement("div");
    card.className = "equip-popup-card";

    const img = document.createElement("img");
    img.src =
      item.image ||
      item.img ||
      item.icon ||
      "https://via.placeholder.com/64?text=No+Img";

    img.alt = item.name || "";
    card.appendChild(img);

    if (type === "weapon" && !hasCharacter) {
      card.classList.add("disabled");
    } else {
      card.onclick = () => {
        if (!activeEquipSlot) return;

        const { row, col } = activeEquipSlot;
        equipSlots[row][col] = item;

        renderEquipSlots();
        updateURL();  
        closeEquipPopup();
      };
    }

    grid.appendChild(card);
  });

  body.appendChild(grid);
}
});

