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
document.addEventListener("DOMContentLoaded", function () {
  fetch("data/characters.json")
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      characters = data.map(function (c) {
        return {
          name: c.name,
          element: c.element,
          class: c.class,
          position: c.position,
          image:
            c.image && c.image.trim()
              ? c.image
              : FALLBACK_IMG
        };
      });

      loadFromURLorStorage();
      setupFilters();
      renderCharacters();
      renderTeam();
    })
    .catch(function (err) {
      console.error("JSON LOAD ERROR", err);
    });
});

/* ================= FILTER ================= */
function setupFilters() {
  document.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const type = btn.dataset.type;
      const value = btn.dataset.value;

      if (value === "") {
        activeFilters[type] = [];
        document
          .querySelectorAll(
            '.filter-btn[data-type="' + type + '"]'
          )
          .forEach(function (b) {
            b.classList.remove("active");
          });
        btn.classList.add("active");
      } else {
        const allBtn = document.querySelector(
          '.filter-btn[data-type="' +
            type +
            '"][data-value=""]'
        );
        if (allBtn) allBtn.classList.remove("active");

        btn.classList.toggle("active");

        if (btn.classList.contains("active")) {
          if (activeFilters[type].indexOf(value) === -1) {
            activeFilters[type].push(value);
          }
        } else {
          activeFilters[type] = activeFilters[type].filter(
            function (v) {
              return v !== value;
            }
          );
        }
      }

      toggleResetButton();
      renderCharacters();
    });
  });

  searchInput.addEventListener("input", function () {
    toggleResetButton();
    renderCharacters();
  });
}

/* ================= RESET ================= */
resetFilterBtn.onclick = function () {
  activeFilters = {
    position: [],
    element: [],
    class: []
  };

  searchInput.value = "";

  document.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.classList.remove("active");
    if (btn.dataset.value === "") {
      btn.classList.add("active");
    }
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
    .filter(function (c) {
      return (
        (!activeFilters.position.length ||
          activeFilters.position.indexOf(c.position) !== -1) &&
        (!activeFilters.element.length ||
          activeFilters.element.indexOf(c.element) !== -1) &&
        (!activeFilters.class.length ||
          activeFilters.class.indexOf(c.class) !== -1) &&
        c.name
          .toLowerCase()
          .indexOf(searchInput.value.toLowerCase()) !==
          -1
      );
    })
    .forEach(function (c) {
      const card = document.createElement("div");
      card.className = "card";
      card.draggable = true;

      if (team.some(function (t) { return t && t.name === c.name; })) {
        card.classList.add("in-team");
      }

      card.innerHTML =
        '<img src="' +
        c.image +
        '">' +
        "<strong>" +
        c.name +
        "</strong>" +
        "<span>" +
        c.element +
        " • " +
        c.class +
        " • " +
        c.position +
        "</span>";

      card.onclick = function () {
         toggleCharacterInTeam(c);
       };

      card.addEventListener("dragstart", function (e) {
  e.dataTransfer.setData("type", "character");
  e.dataTransfer.setData("char", c.name);
});

      charsEl.appendChild(card);
    });
}

/* ================= TEAM ================= */
function addToTeam(c) {
  if (team.some(function (t) { return t.name === c.name; })) return;
  if (team.length >= MAX_TEAM) {
    alert("Max 5 characters");
    return;
  }

  team.push(c);
  persist();
  updateURL();
  renderTeam();
}

function removeFromTeam(name) {
  team = team.filter(function (t) {
    return t.name !== name;
  });
  persist();
  updateURL();
  renderTeam();
}

function toggleCharacterInTeam(character) {
  const index = team.findIndex(t => t.name === character.name);

  if (index !== -1) {
    // sudah ada → hapus
    team.splice(index, 1);
  } else {
    // belum ada → tambah
    if (team.length >= MAX_TEAM) {
      alert("Max 5 characters");
      return;
    }
    team.push(character);
  }

  persist();
  updateURL();
  renderTeam();
}

function renderTeam() {
  // PASTIKAN SLOT SELALU 5 (INDEX STABIL)
  while (team.length < MAX_TEAM) {
    team.push(null);
  }

  teamEl.innerHTML = "";

  for (let i = 0; i < MAX_TEAM; i++) {
    const slot = document.createElement("div");
    slot.dataset.index = i;

    slot.addEventListener("dragover", function (e) {
      e.preventDefault();
    });

    slot.addEventListener("drop", onDrop);

    if (team[i]) {
      slot.className = "team-card";
      slot.draggable = true;

      slot.innerHTML =
        '<img src="' + team[i].image + '">' +
        "<strong>" + team[i].name + "</strong>";

      // klik = remove
      slot.onclick = function () {
        removeFromTeam(team[i].name);
      };

      // drag antar team slot
      slot.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("type", "team");
        e.dataTransfer.setData("from", i);
      });

    } else {
      slot.className = "team-slot";
    }

    teamEl.appendChild(slot);
  }

  renderSynergyWarning();
  renderCharacters();
}

function onDrop(e) {
  e.preventDefault();

  const targetIndex = Number(this.dataset.index);
  const type = e.dataTransfer.getData("type");

  // DRAG DARI CHARACTER LIST
  if (type === "character") {
    const name = e.dataTransfer.getData("char");
    const c = characters.find(x => x.name === name);
    if (!c) return;

    // kalau sudah ada di team → ignore
    if (team.some(t => t && t.name === c.name)) return;

    team[targetIndex] = c;
  }

  // DRAG ANTAR TEAM SLOT
  if (type === "team") {
    const fromIndex = Number(e.dataTransfer.getData("from"));
    if (fromIndex === targetIndex) return;

    const temp = team[fromIndex];
    team[fromIndex] = team[targetIndex];
    team[targetIndex] = temp;
  }

  persist();
  updateURL();
  renderTeam();
}

/* ================= TEAM SYNERGY WARNING ================= */
let synergyWarningEls = [];

function renderSynergyWarning() {
  // hapus warning lama
  synergyWarningEls.forEach(el => el.remove());
  synergyWarningEls = [];

 const filledTeam = team.filter(Boolean);
if (filledTeam.length === 0) return;

  // 🔥 EXCEPTION: CLAIRE
  const hasClaire = team.some(c => c && c.name === "Claire");
  if (hasClaire) return;

  const classes = team.filter(Boolean).map(c => c.class);

  const hasKnight = classes.includes("Knight");
  const hasHealer = classes.includes("Healer");

  const onlyKnightWizardArcher = classes.every(c =>
    c === "Knight" || c === "Wizard" || c === "Archer"
  );

  const onlyWizardArcherHealer = classes.every(c =>
    c === "Wizard" || c === "Archer" || c === "Healer"
  );

  const onlyWizardArcher = classes.every(c =>
    c === "Wizard" || c === "Archer"
  );

  const warnings = [];

  // RULE 3 (PALING SPESIFIK, DULUAN)
  if (onlyWizardArcher) {
    warnings.push(
      "Anda tidak memiliki unit sustain (shield, lifesteal, heals) di dalam tim"
    );
    warnings.push(
      "Anda tidak memiliki unit frontline (Knight) untuk menahan serangan"
    );
  } else {
    // RULE 1
    if (onlyKnightWizardArcher && !hasHealer) {
      warnings.push(
        "Anda tidak memiliki unit sustain (shield, lifesteal, heals) di dalam tim"
      );
    }

    // RULE 2
    if (onlyWizardArcherHealer && !hasKnight) {
      warnings.push(
        "Anda tidak memiliki unit frontline (Knight) untuk menahan serangan"
      );
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

/* ================= PERSIST ================= */
function persist() {
  localStorage.setItem("team", JSON.stringify(team));
}

function loadFromURLorStorage() {
  const p = new URLSearchParams(location.search).get("team");
  if (p) {
    team = p
      .split(",")
      .map(decodeURIComponent)
      .map(function (n) {
        return characters.find(function (c) {
          return c.name === n;
        });
      })
      .filter(Boolean);
    return;
  }

  const s = localStorage.getItem("team");
  if (s) team = JSON.parse(s);
}

/* ================= SHARE ================= */
function updateURL() {
  const names = team
    .map(function (t) {
      return encodeURIComponent(t.name);
    })
    .join(",");

  history.replaceState(
    null,
    "",
    names ? "?team=" + names : location.pathname
  );
}

shareBtn.onclick = function () {
  navigator.clipboard.writeText(location.href);
  alert("Link copied!");
};
