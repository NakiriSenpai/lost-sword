console.log("JS OK");

fetch("./data/characters.json")
  .then(r => r.json())
  .then(data => {
    const el = document.getElementById("characters");
    data.forEach(c => {
      const d = document.createElement("div");
      d.className = "card";
      d.innerHTML = `
        <img src="${c.image}">
        <strong>${c.name}</strong>
        <span>${c.element} • ${c.class} • ${c.position}</span>
      `;
      el.appendChild(d);
    });
  })
  .catch(err => console.error(err));
