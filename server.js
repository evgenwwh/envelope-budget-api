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

const findEnvelope = (id) => envelopes.find((e) => e.id === Number(id));

app.get('/envelopes/:id', (req, res) => {
  const envelope = findEnvelope(req.params.id);
  if (!envelope) {
    return res.status(404).json({ error: 'Envelope not found' });
  }
  res.json(envelope);
});

app.put('/envelopes/:id', (req, res) => {
  const envelope = findEnvelope(req.params.id);
  if (!envelope) {
    return res.status(404).json({ error: 'Envelope not found' });
  }

  const { title, budget, spend } = req.body || {};

  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({ error: 'Title must be a non-empty string' });
  }
  if (budget !== undefined && (typeof budget !== 'number' || !Number.isFinite(budget) || budget < 0)) {
    return res.status(400).json({ error: 'Budget must be a non-negative number' });
  }
  if (spend !== undefined && (typeof spend !== 'number' || !Number.isFinite(spend) || spend <= 0)) {
    return res.status(400).json({ error: 'Spend must be a positive number' });
  }

  let newBudget = budget !== undefined ? budget : envelope.budget;
  if (spend !== undefined) {
    if (spend > newBudget) {
      return res.status(400).json({ error: `Not enough money in "${envelope.title}"` });
    }
    newBudget -= spend;
  }

  if (title !== undefined) envelope.title = title.trim();
  totalBudget += newBudget - envelope.budget;
  envelope.budget = newBudget;

  res.json(envelope);
});

app.delete('/envelopes/:id', (req, res) => {
  const index = envelopes.findIndex((e) => e.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Envelope not found' });
  }

  totalBudget -= envelopes[index].budget;
  envelopes.splice(index, 1);
  res.status(204).send();
});

app.post('/envelopes/transfer/:from/:to', (req, res) => {
  const from = findEnvelope(req.params.from);
  const to = findEnvelope(req.params.to);
  if (!from || !to) {
    return res.status(404).json({ error: 'Envelope not found' });
  }
  if (from === to) {
    return res.status(400).json({ error: 'Cannot transfer to the same envelope' });
  }

  const { amount } = req.body || {};
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }
  if (amount > from.budget) {
    return res.status(400).json({ error: `Not enough money in "${from.title}"` });
  }

  from.budget -= amount;
  to.budget += amount;

  res.json({ from, to });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
