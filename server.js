const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Global storage for envelopes and the total budget
let envelopes = [];
let totalBudget = 0;
let nextId = 1;

app.get('/', (req, res) => {
  res.send('Hello, World');
});

// Create a new envelope
app.post('/envelopes', (req, res) => {
  const { title, budget } = req.body || {};

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
  }
  if (typeof budget !== 'number' || !Number.isFinite(budget) || budget < 0) {
    return res.status(400).json({ error: 'Budget must be a non-negative number' });
  }

  const envelope = { id: nextId++, title: title.trim(), budget };
  envelopes.push(envelope);
  totalBudget += budget;

  res.status(201).json(envelope);
});

// Get all envelopes
app.get('/envelopes', (req, res) => {
  res.json({ totalBudget, envelopes });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
