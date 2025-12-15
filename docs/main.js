let characters=[], team=[];
const charsEl=document.getElementById("characters");
const teamEl=document.getElementById("team");
const elF=document.getElementById("elementFilter");
const clF=document.getElementById("classFilter");
const shareBtn=document.getElementById("shareBtn");

const FALLBACK_IMG="https://via.placeholder.com/300x200?text=No+Image";

// --- LOAD DATA ---
fetch("data/characters.json").then(r=>r.json()).then(data=>{
  characters=data.map(c=>({
    ...c,
    image: c.image && c.image.trim() ? c.image : FALLBACK_IMG
  }));
  initFilters();
  loadFromURLorStorage();
  renderCharacters();
  renderTeam();
});

// --- FILTERS ---
function initFilters(){
  [...new Set(characters.map(c=>c.element))].forEach(v=>elF.innerHTML+=`<option>${v}</option>`);
  [...new Set(characters.map(c=>c.class))].forEach(v=>clF.innerHTML+=`<option>${v}</option>`);
}
elF.onchange=clF.onchange=renderCharacters;

// --- RENDER CHARACTERS ---
function renderCharacters(){
  charsEl.innerHTML="";
  characters.filter(c=>
    (!elF.value||c.element===elF.value)&&(!clF.value||c.class===clF.value)
  ).forEach(c=>{
    const d=document.createElement("div");
    d.className="card";
    d.draggable = false; // 
    d.innerHTML=`
      <img src="${c.image}" onerror="this.src='${FALLBACK_IMG}'">
      <strong>${c.name}</strong>
      <div class="badge">${c.element} • ${c.class} • ${c.position}</div>
    `;
    d.onclick = () => addToTeam(c);
    charsEl.appendChild(d);
  });
}

// --- TEAM LOGIC ---
function addToTeam(c){
  if(team.find(t=>t.name===c.name))return;
  if(team.length>=5){alert("Max 5");return;}
  team.push(c); persist(); renderTeam(); updateURL();
}
function removeFromTeam(name){
  team=team.filter(t=>t.name!==name); persist(); renderTeam(); updateURL();
}
function renderTeam(){
  teamEl.innerHTML="";
  team.forEach(c=>{
    const d=document.createElement("div");
    d.className="team-card";

    d.innerHTML = `
      <img src="${c.image}" onerror="this.src='${FALLBACK_IMG}'">
      <span>${c.name}</span>
    `;

    d.onclick = () => removeFromTeam(c.name);
    teamEl.appendChild(d);
  });
}

// --- DRAG & DROP (HP OK) ---
teamEl.ondragover=e=>e.preventDefault();
teamEl.ondrop=e=>{
  e.preventDefault();
  const name=e.dataTransfer.getData("text/plain");
  const c=characters.find(x=>x.name===name);
  if(c) addToTeam(c);
};

// --- SHARE LINK ---
function updateURL(){
  const names=team.map(t=>encodeURIComponent(t.name)).join(",");
  history.replaceState(null,"",names?`?team=${names}`:location.pathname);
}
shareBtn.onclick=()=>{
  navigator.clipboard.writeText(location.href);
  alert("Link copied!");
};

// --- LOAD FROM URL / STORAGE ---
function loadFromURLorStorage(){
  const p=new URLSearchParams(location.search).get("team");
  if(p){
    const names=p.split(",").map(decodeURIComponent);
    team=characters.filter(c=>names.includes(c.name));
    return;
  }
  const s=localStorage.getItem("team");
  if(s) team=JSON.parse(s);
}
function persist(){
  localStorage.setItem("team",JSON.stringify(team));
}
