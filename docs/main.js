// ====================================================== // MAIN.JS VERSI BARU (LOOTANDWAIFUS STYLE) // - Drag & Drop Desktop // - Touch Drag Mobile // - Drag antar Team Slot // - Synergy Bonus // ======================================================

console.log("MAIN JS LOADED (NEW VERSION)");

const charsEl = document.getElementById("characters"); const teamEl = document.getElementById("team");

let characters = []; let team = Array(5).fill(null);

/* ================= LOAD DATA ================= */ fetch("characters.json") .then(r => r.json()) .then(data => { characters = data; renderCharacters(); renderTeam(); });

/* ================= RENDER CHARACTERS ================= */ function renderCharacters() { charsEl.innerHTML = "";

characters.forEach(c => { const card = document.createElement("div"); card.className = "card";

card.innerHTML = `
  <img src="${c.image}" />
  <strong>${c.name}</strong>
  <span>${c.element} • ${c.class} • ${c.position}</span>
`;

// DESKTOP DRAG
card.draggable = true;
card.addEventListener("dragstart", e => {
  e.dataTransfer.setData("name", c.name);
});

// TAP ADD
card.onclick = () => addToFirstEmptySlot(c);

// MOBILE TOUCH DRAG
enableTouchDrag(card, c);

charsEl.appendChild(card);

}); }

/* ================= TEAM ================= */ function renderTeam() { teamEl.innerHTML = "";

team.forEach((c, index) => { const slot = document.createElement("div"); slot.className = c ? "team-card" : "team-slot"; slot.dataset.index = index;

slot.addEventListener("dragover", e => e.preventDefault());

slot.addEventListener("drop", e => {
  const name = e.dataTransfer.getData("name");
  const char = characters.find(x => x.name === name);
  if (char) placeCharToSlot(char, index);
});

if (c) {
  slot.innerHTML = `
    <img src="${c.image}" />
    <strong>${c.name}</strong>
  `;

  // DRAG ANTAR SLOT (DESKTOP)
  slot.draggable = true;
  slot.addEventListener("dragstart", e => {
    e.dataTransfer.setData("from", index);
  });

  slot.addEventListener("drop", e => {
    const from = e.dataTransfer.getData("from");
    if (from !== "") swapTeam(from, index);
  });
}

teamEl.appendChild(slot);

});

renderSynergy(); }

function addToFirstEmptySlot(character) { if (team.some(t => t?.name === character.name)) return;

const idx = team.findIndex(s => s === null); if (idx === -1) return;

team[idx] = character; renderTeam(); }

function placeCharToSlot(character, index) { if (team.some(t => t?.name === character.name)) return; team[index] = character; renderTeam(); }

function swapTeam(from, to) { const tmp = team[from]; team[from] = team[to]; team[to] = tmp; renderTeam(); }

/* ================= SYNERGY ================= */ function renderSynergy() { const counts = {};

team.forEach(c => { if (!c) return; counts[c.element] = (counts[c.element] || 0) + 1; });

console.table(counts); }

/* ================= TOUCH DRAG (MOBILE) ================= */ let touchChar = null; let ghost = null;

function enableTouchDrag(el, character) { el.addEventListener("touchstart", e => { touchChar = character; ghost = el.cloneNode(true); ghost.classList.add("dragging"); document.body.appendChild(ghost); moveGhost(e.touches[0]); });

el.addEventListener("touchmove", e => { if (!ghost) return; e.preventDefault(); moveGhost(e.touches[0]); });

el.addEventListener("touchend", e => { if (!ghost) return;

const t = e.changedTouches[0];
const target = document.elementFromPoint(t.clientX, t.clientY);
const slot = target?.closest(".team-slot, .team-card");

if (slot) {
  const idx = Number(slot.dataset.index);
  placeCharToSlot(touchChar, idx);
}

ghost.remove();
ghost = null;
touchChar = null;

}); }

function moveGhost(t) { ghost.style.left = t.clientX - 50 + "px"; ghost.style.top = t.clientY - 70 + "px"; }
