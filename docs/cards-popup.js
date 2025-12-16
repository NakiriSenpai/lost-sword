/* ================= CARD SYSTEM ================= */

let cards = [];
let activeTeamIndex = null;

const FALLBACK_CARD =
  "https://via.placeholder.com/80x80?text=Card";

/* LOAD CARDS */
fetch("data/cards.json")
  .then(r => r.json())
  .then(data => {
    cards = data.map(c => ({
      ...c,
      img: c.img?.trim() ? c.img : FALLBACK_CARD
    }));
  });

/* CREATE POPUP HTML */
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

/* OPEN POPUP */
window.openCardPopup = function (teamIndex) {
  activeTeamIndex = teamIndex;
  cardSearch.value = "";
  popup.classList.remove("hidden");
  renderCardList();
};

/* CLOSE POPUP */
popup.querySelector(".close").onclick = () => {
  popup.classList.add("hidden");
};

/* SEARCH */
cardSearch.oninput = renderCardList;

/* RENDER CARD LIST */
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

/* SELECT CARD */
function selectCard(card) {
  if (activeTeamIndex === null) return;

  team[activeTeamIndex].card = card;
  persist();
  popup.classList.add("hidden");
  renderTeam();
  }
