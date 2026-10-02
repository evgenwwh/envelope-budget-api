const express = require('express');
const { sequelize, Envelope, Transaction } = require('../models');
const {
  ApiError,
  isValidTitle,
  isPositiveMoney,
  isValidDate,
  toCents,
  fromCents,
  findById,
} = require('../utils');

const router = express.Router();

const withEnvelope = { include: { model: Envelope, attributes: ['id', 'title'] } };

const validate = ({ envelopeId, amount, recipient, date }, isUpdate = false) => {
  if (!isUpdate && envelopeId === undefined) {
    throw new ApiError(400, 'envelopeId is required');
  }
  if ((!isUpdate || amount !== undefined) && !isPositiveMoney(amount)) {
    throw new ApiError(400, 'Amount must be a positive number');
  }
  if ((!isUpdate || recipient !== undefined) && !isValidTitle(recipient)) {
    throw new ApiError(400, 'Recipient is required');
  }
  if (date !== undefined && !isValidDate(date)) {
    throw new ApiError(400, 'Date must be in YYYY-MM-DD format');
  }
};

const withdraw = async (envelope, cents, transaction) => {
  if (cents > toCents(envelope.budget)) {
    throw new ApiError(400, `Not enough money in "${envelope.title}"`);
  }
  envelope.budget = fromCents(toCents(envelope.budget) - cents);
  await envelope.save({ transaction });
};

const refund = async (envelope, cents, transaction) => {
  envelope.budget = fromCents(toCents(envelope.budget) + cents);
  await envelope.save({ transaction });
};

router.get('/', async (req, res) => {
  const transactions = await Transaction.findAll({
    ...withEnvelope,
    order: [['date', 'DESC'], ['id', 'DESC']],
  });
  res.json(transactions);
});

router.get('/:id', async (req, res) => {
  res.json(await findById(Transaction, req.params.id, withEnvelope));
});

router.post('/', async (req, res) => {
  const body = req.body || {};
  validate(body);

  const { id } = await sequelize.transaction(async (transaction) => {
    const envelope = await findById(Envelope, body.envelopeId, { transaction, lock: true });
    await withdraw(envelope, toCents(body.amount), transaction);

    return Transaction.create({
      envelopeId: envelope.id,
      amount: body.amount,
      recipient: body.recipient.trim(),
      date: body.date,
    }, { transaction });
  });

  res.status(201).json(await Transaction.findByPk(id, withEnvelope));
});

router.put('/:id', async (req, res) => {
  const body = req.body || {};
  validate(body, true);

  await sequelize.transaction(async (transaction) => {
    const record = await findById(Transaction, req.params.id, { transaction, lock: true });
    const oldEnvelope = await Envelope.findByPk(record.envelopeId, { transaction, lock: true });
    const newEnvelope = body.envelopeId === undefined || Number(body.envelopeId) === oldEnvelope.id
      ? oldEnvelope
      : await findById(Envelope, body.envelopeId, { transaction, lock: true });

    await refund(oldEnvelope, toCents(record.amount), transaction);
    await withdraw(newEnvelope, toCents(body.amount ?? record.amount), transaction);

    record.envelopeId = newEnvelope.id;
    if (body.amount !== undefined) record.amount = body.amount;
    if (body.recipient !== undefined) record.recipient = body.recipient.trim();
    if (body.date !== undefined) record.date = body.date;
    await record.save({ transaction });
  });

  res.json(await Transaction.findByPk(req.params.id, withEnvelope));
});

router.delete('/:id', async (req, res) => {
  await sequelize.transaction(async (transaction) => {
    const record = await findById(Transaction, req.params.id, { transaction, lock: true });
    const envelope = await Envelope.findByPk(record.envelopeId, { transaction, lock: true });

    await refund(envelope, toCents(record.amount), transaction);
    await record.destroy({ transaction });
  });

  res.status(204).send();
});

module.exports = router;
