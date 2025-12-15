let characters = [];
let team = [];

const charsEl = document.getElementById("characters");
const teamEl = document.getElementById("team");
const elementFilter = document.getElementById("elementFilter");
const classFilter = document.getElementById("classFilter");

fetch("data/characters.json")
  .then(res => res.json())
  .then(data => {
    characters = data;
    initFilters();
    renderCharacters();
  });

function initFilters() {
  [...new Set(characters.map(c => c.element))].forEach(el => {
    elementFilter.innerHTML += `<option value="${el}">${el}</option>`;
  });

  [...new Set(characters.map(c => c.class))].forEach(cl => {
    classFilter.innerHTML += `<option value="${cl}">${cl}</option>`;
  });
}

elementFilter.onchange = classFilter.onchange = renderCharacters;

function renderCharacters() {
  charsEl.innerHTML = "";

  characters
    .filter(c =>
      (!elementFilter.value || c.element === elementFilter.value) &&
      (!classFilter.value || c.class === classFilter.value)
    )
    .forEach(c => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <strong>${c.name}</strong><br>
        ${c.element}<br>
        ${c.class}<br>
        ${c.position}
      `;
      div.onclick = () => addToTeam(c);
      charsEl.appendChild(div);
    });
}

function addToTeam(c) {
  if (team.includes(c)) return;
  if (team.length >= 5) {
    alert("Max 5 characters");
    return;
  }
  team.push(c);
  renderTeam();
}

function renderTeam() {
  teamEl.innerHTML = "";
  team.forEach(c => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<strong>${c.name}</strong>`;
    div.onclick = () => {
      team = team.filter(t => t !== c);
      renderTeam();
    };
    teamEl.appendChild(div);
  });
      }
