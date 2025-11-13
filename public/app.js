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

const playerForm = document.getElementById('player-form');
if (playerForm) {
  playerForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    await api('players', { method: 'POST', body: JSON.stringify(payload) });
    e.target.reset();
    loadPlayers();
  });
}

const matchForm = document.getElementById('match-form');
if (matchForm) {
  matchForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    await api('matches', { method: 'POST', body: JSON.stringify(payload) });
    e.target.reset();
    loadMatches();
  });
}

const simulateBtn = document.getElementById('simulate');
if (simulateBtn) {
  simulateBtn.addEventListener('click', async ()=>{
    const res = await api('draft/simulate', { method: 'POST', body: JSON.stringify({}) });
    const draftResult = document.getElementById('draft-result');
    if (draftResult) {
      draftResult.textContent = JSON.stringify(res, null, 2);
    }
  });
}

// Only load players and matches if the relevant elements exist
if (document.querySelector('.players-list') || document.querySelector('#players-container')) {
  loadPlayers();
}

if (document.querySelector('.matches-list') || document.querySelector('#matches-container')) {
  loadMatches();
}
