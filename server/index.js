const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const playersRouter = require('./routes/players');
const matchesRouter = require('./routes/matches');
const draftRouter = require('./routes/draft');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/players', playersRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/draft', draftRouter);

app.get('/api/ping', (req, res) => res.json({pong: true}));

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
