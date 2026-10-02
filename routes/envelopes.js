const express = require('express');
const { sequelize, Envelope } = require('../models');
const {
  ApiError,
  isValidTitle,
  isMoney,
  isPositiveMoney,
  isValidId,
  toCents,
  fromCents,
} = require('../utils');

const router = express.Router();

const findEnvelope = async (id, options = {}) => {
  const envelope = isValidId(id) ? await Envelope.findByPk(id, options) : null;
  if (!envelope) {
    throw new ApiError(404, `Envelope ${id} not found`);
  }
  return envelope;
};

const getTotalBudget = async () => Number(await Envelope.sum('budget')) || 0;

router.get('/', async (req, res) => {
  const envelopes = await Envelope.findAll({ order: [['id', 'ASC']] });
  res.json({ totalBudget: await getTotalBudget(), envelopes });
});

router.post('/', async (req, res) => {
  const { title, budget } = req.body || {};

  if (!isValidTitle(title)) {
    throw new ApiError(400, 'Title is required and must be a non-empty string');
  }
  if (!isMoney(budget)) {
    throw new ApiError(400, 'Budget must be a non-negative number');
  }

  const envelope = await Envelope.create({ title: title.trim(), budget: fromCents(toCents(budget)) });
  res.status(201).json(envelope);
});

router.post('/transfer/:from/:to', async (req, res) => {
  const { amount } = req.body || {};

  if (!isPositiveMoney(amount)) {
    throw new ApiError(400, 'Amount must be a positive number');
  }
  if (Number(req.params.from) === Number(req.params.to)) {
    throw new ApiError(400, 'Cannot transfer to the same envelope');
  }

  const result = await sequelize.transaction(async (transaction) => {
    const from = await findEnvelope(req.params.from, { transaction, lock: true });
    const to = await findEnvelope(req.params.to, { transaction, lock: true });
    const cents = toCents(amount);

    if (cents > toCents(from.budget)) {
      throw new ApiError(400, `Not enough money in "${from.title}"`);
    }

    from.budget = fromCents(toCents(from.budget) - cents);
    to.budget = fromCents(toCents(to.budget) + cents);
    await from.save({ transaction });
    await to.save({ transaction });

    return { from, to };
  });

  res.json(result);
});

router.post('/distribute', async (req, res) => {
  const { amount, envelopeIds } = req.body || {};

  if (!isPositiveMoney(amount)) {
    throw new ApiError(400, 'Amount must be a positive number');
  }
  if (!Array.isArray(envelopeIds) || envelopeIds.length === 0) {
    throw new ApiError(400, 'envelopeIds must be a non-empty array');
  }

  const cents = toCents(amount);

  const envelopes = await sequelize.transaction(async (transaction) => {
    const targets = [];
    for (const id of new Set(envelopeIds.map(Number))) {
      targets.push(await findEnvelope(id, { transaction, lock: true }));
    }

    const share = Math.floor(cents / targets.length);
    let remainder = cents % targets.length;

    for (const envelope of targets) {
      const extra = remainder > 0 ? 1 : 0;
      remainder -= extra;
      envelope.budget = fromCents(toCents(envelope.budget) + share + extra);
      await envelope.save({ transaction });
    }

    return targets;
  });

  res.json({ added: fromCents(cents), totalBudget: await getTotalBudget(), envelopes });
});

router.get('/:id', async (req, res) => {
  res.json(await findEnvelope(req.params.id));
});

router.put('/:id', async (req, res) => {
  const { title, budget, spend } = req.body || {};

  if (title !== undefined && !isValidTitle(title)) {
    throw new ApiError(400, 'Title must be a non-empty string');
  }
  if (budget !== undefined && !isMoney(budget)) {
    throw new ApiError(400, 'Budget must be a non-negative number');
  }
  if (spend !== undefined && !isPositiveMoney(spend)) {
    throw new ApiError(400, 'Spend must be a positive number');
  }

  const envelope = await sequelize.transaction(async (transaction) => {
    const envelope = await findEnvelope(req.params.id, { transaction, lock: true });
    let newBudget = toCents(budget !== undefined ? budget : envelope.budget);

    if (spend !== undefined) {
      if (toCents(spend) > newBudget) {
        throw new ApiError(400, `Not enough money in "${envelope.title}"`);
      }
      newBudget -= toCents(spend);
    }

    if (title !== undefined) {
      envelope.title = title.trim();
    }
    envelope.budget = fromCents(newBudget);

    return envelope.save({ transaction });
  });

  res.json(envelope);
});

router.delete('/:id', async (req, res) => {
  const envelope = await findEnvelope(req.params.id);
  await envelope.destroy();
  res.status(204).send();
});

module.exports = router;
