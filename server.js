require('dotenv').config({ quiet: true });

const fs = require('fs');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const { sequelize } = require('./models');
const envelopesRouter = require('./routes/envelopes');
const transactionsRouter = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 3000;
const swaggerDocument = YAML.parse(fs.readFileSync('./swagger.yaml', 'utf8'));

app.use(express.json());
app.use(express.static('public'));

app.use('/envelopes', envelopesRouter);
app.use('/transactions', transactionsRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((err, req, res, next) => {
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
});
