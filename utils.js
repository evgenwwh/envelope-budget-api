class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const isValidTitle = (value) => typeof value === 'string' && value.trim() !== '';
const isMoney = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const isPositiveMoney = (value) => isMoney(value) && value > 0;
const isValidId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const toCents = (value) => Math.round(value * 100);
const fromCents = (cents) => cents / 100;

module.exports = {
  ApiError,
  isValidTitle,
  isMoney,
  isPositiveMoney,
  isValidId,
  toCents,
  fromCents,
};
