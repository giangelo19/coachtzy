async function api(path, opts = {}){
  const res = await fetch(`/api/${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  return res.json();
}

async function loadPlayers(){
  const list = document.getElementById('player-list');
  list.innerHTML = '';
  const players = await api('players');
  players.forEach(p => {
    const li = document.createElement('li');
    li.textContent = `${p.id} • ${p.name} [${p.role || '-'}] MMR:${p.mmr || '-'} `;
    list.appendChild(li);
  });
}

async function loadMatches(){
  const list = document.getElementById('match-list');
  list.innerHTML = '';
  const matches = await api('matches');
  matches.forEach(m => {
    const li = document.createElement('li');
    li.textContent = `${m.id} • ${m.date || '-'} vs ${m.opponent || '-'} => ${m.result || '-'} `;
    list.appendChild(li);
  });
}

document.getElementById('player-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = Object.fromEntries(fd.entries());
  await api('players', { method: 'POST', body: JSON.stringify(payload) });
  e.target.reset();
  loadPlayers();
});

document.getElementById('match-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = Object.fromEntries(fd.entries());
  await api('matches', { method: 'POST', body: JSON.stringify(payload) });
  e.target.reset();
  loadMatches();
});

document.getElementById('simulate').addEventListener('click', async ()=>{
  const res = await api('draft/simulate', { method: 'POST', body: JSON.stringify({}) });
  document.getElementById('draft-result').textContent = JSON.stringify(res, null, 2);
});

loadPlayers();
loadMatches();
