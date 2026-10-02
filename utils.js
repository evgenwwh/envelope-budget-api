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
const isValidDate = (value) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

const toCents = (value) => Math.round(value * 100);
const fromCents = (cents) => cents / 100;

const findById = async (Model, id, options = {}) => {
  const record = isValidId(id) ? await Model.findByPk(id, options) : null;
  if (!record) {
    throw new ApiError(404, `${Model.name} ${id} not found`);
  }
  return record;
};

module.exports = {
  ApiError,
  isValidTitle,
  isMoney,
  isPositiveMoney,
  isValidId,
  isValidDate,
  toCents,
  fromCents,
  findById,
};
