const { useState, useEffect } = React;

function App() {
  const [characters, setCharacters] = useState([]);
  const [team, setTeam] = useState([]);

  useEffect(() => {
    // GANTI URL INI SETELAH BACKEND DEPLOY
    fetch("data/characters.json")
  .then(res => res.json())
  .then(data => {
    characters = data;
    renderCharacters();
  });

  function addToTeam(char) {
    if (team.length >= 5) return;
    setTeam([...team, char]);
  }

  function removeFromTeam(index) {
    setTeam(team.filter((_, i) => i !== index));
  }

  return (
    <div className="container">
      <h1>Lost Sword Team Builder</h1>

      <div className="grid">
        {characters.map((c, i) => (
          <div
            key={i}
            className="card"
            onClick={() => addToTeam(c)}
          >
            <b>{c.name}</b>
            <div>{c.element}</div>
            <small>{c.class} • {c.position}</small>
          </div>
        ))}
      </div>

      <div className="team">
        <h2>Tim ({team.length}/5)</h2>

        {team.map((c, i) => (
          <div
            key={i}
            className="team-item"
            onClick={() => removeFromTeam(i)}
          >
            {c.name}
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
