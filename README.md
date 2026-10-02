# Personal Budget

A small envelope budgeting app built with Node.js, Express, PostgreSQL and Sequelize. You split your money into envelopes (Food, Rent, Fun...), spend from them, move money between them, split new money across several at once and keep track of what you paid for. The API won't let you spend more than an envelope has.

## Database

Two tables:

- `envelopes` – `id`, `title`, `budget`
- `transactions` – `id`, `date`, `amount`, `recipient`, `envelopeId`

Every transaction belongs to one envelope. Deleting an envelope also deletes its transactions. Tables are created by Sequelize when the server starts.

## Getting started

You need Node.js and PostgreSQL.

```bash
createdb personal_budget
npm install
npm start
```

Create a `.env` file with the database URL:

```
DATABASE_URL=postgres://localhost:5432/personal_budget
```

Change it if your database runs somewhere else. Set `DATABASE_SSL=true` if the database needs SSL (for example an external Render URL).

Open http://localhost:3000 to use the app in the browser (set `PORT` to change the port). For auto-reload while developing, use `npm run dev`.

API docs (Swagger) are at http://localhost:3000/api-docs.

## Frontend

The page lives in `public/` and is served by the same Express server. From there you can:

- add envelopes
- see every envelope and the total budget
- spend from an envelope
- rename an envelope or change its budget
- delete an envelope
- move money from one envelope to another
- split an amount evenly between the envelopes you pick
- add and delete transactions

## API

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/envelopes` | List all envelopes and the total budget |
| POST | `/envelopes` | Create an envelope |
| GET | `/envelopes/:id` | Get one envelope |
| PUT | `/envelopes/:id` | Update an envelope or spend from it |
| DELETE | `/envelopes/:id` | Delete an envelope and its transactions |
| POST | `/envelopes/transfer/:from/:to` | Move money from one envelope to another |
| POST | `/envelopes/distribute` | Split an amount between several envelopes |
| GET | `/transactions` | List all transactions, newest first |
| POST | `/transactions` | Create a transaction |
| GET | `/transactions/:id` | Get one transaction |
| PUT | `/transactions/:id` | Update a transaction |
| DELETE | `/transactions/:id` | Delete a transaction |

### Create an envelope

```http
POST /envelopes
Content-Type: application/json

{ "title": "Food", "budget": 300 }
```

Returns `201` with the new envelope:

```json
{ "id": 1, "title": "Food", "budget": 300 }
```

### List envelopes

```http
GET /envelopes
```

```json
{
  "totalBudget": 300,
  "envelopes": [{ "id": 1, "title": "Food", "budget": 300 }]
}
```

### Update an envelope

All fields are optional. Use `spend` to take money out, or `title` / `budget` to change the envelope itself.

```http
PUT /envelopes/1
Content-Type: application/json

{ "spend": 50 }
```

```json
{ "id": 1, "title": "Food", "budget": 250 }
```

If `spend` is more than what's left in the envelope, you get a `400`.

### Delete an envelope

```http
DELETE /envelopes/1
```

Returns `204 No Content`.

### Transfer between envelopes

```http
POST /envelopes/transfer/1/2
Content-Type: application/json

{ "amount": 100 }
```

```json
{
  "from": { "id": 1, "title": "Food", "budget": 150 },
  "to": { "id": 2, "title": "Fun", "budget": 150 }
}
```

### Split money between envelopes

Handy when you get paid and want to top up a few envelopes at once. The amount is split evenly; if it doesn't divide into whole cents, the extra cent goes to the first envelopes in the list.

```http
POST /envelopes/distribute
Content-Type: application/json

{ "amount": 100, "envelopeIds": [1, 2, 3] }
```

```json
{
  "added": 100,
  "totalBudget": 400,
  "envelopes": [
    { "id": 1, "title": "Food", "budget": 183.34 },
    { "id": 2, "title": "Fun", "budget": 183.33 },
    { "id": 3, "title": "Rent", "budget": 33.33 }
  ]
}
```

### Create a transaction

The amount is taken from the envelope right away. `date` is optional and defaults to today.

```http
POST /transactions
Content-Type: application/json

{ "envelopeId": 1, "amount": 12.5, "recipient": "Lidl", "date": "2026-10-02" }
```

Returns `201`:

```json
{
  "id": 1,
  "date": "2026-10-02",
  "amount": 12.5,
  "recipient": "Lidl",
  "envelopeId": 1,
  "Envelope": { "id": 1, "title": "Food" }
}
```

If the envelope doesn't have enough money, you get a `400`.

### Update a transaction

All fields are optional. The old amount goes back to the old envelope and the new amount is taken from the new one, so you can also move a transaction to another envelope.

```http
PUT /transactions/1
Content-Type: application/json

{ "amount": 20, "envelopeId": 2 }
```

### Delete a transaction

```http
DELETE /transactions/1
```

Returns `204 No Content`. The amount goes back to the envelope.

## Errors

Errors come back as JSON with an `error` message:

- `400` – invalid input (missing title, negative budget, not enough money, wrong date, etc.)
- `404` – envelope or transaction doesn't exist

## Deploying to Render

The repo has a `render.yaml`, so Render can set everything up from it:

1. Push the code to GitHub.
2. On Render go to **New → Blueprint** and pick this repository.
3. Render creates the PostgreSQL database and the web service and passes `DATABASE_URL` to the app.

After the deploy the app is at `https://<your-service>.onrender.com` and the docs at `/api-docs`.
