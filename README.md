# Personal Budget

A small envelope budgeting app built with Node.js and Express. You split your money into envelopes (Food, Rent, Fun...), spend from them, move money between them and split new money across several at once. The API won't let you spend more than an envelope has.

Data is kept in memory, so it resets when the server restarts.

## Getting started

```bash
npm install
npm start
```

Open http://localhost:3000 to use the app in the browser (set `PORT` to change the port). For auto-reload while developing, use `npm run dev`.

## Frontend

The page lives in `public/` and is served by the same Express server. From there you can:

- add envelopes
- see every envelope and the total budget
- spend from an envelope
- rename an envelope or change its budget
- delete an envelope
- move money from one envelope to another
- split an amount evenly between the envelopes you pick

## API

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/envelopes` | List all envelopes and the total budget |
| POST | `/envelopes` | Create an envelope |
| GET | `/envelopes/:id` | Get one envelope |
| PUT | `/envelopes/:id` | Update an envelope or spend from it |
| DELETE | `/envelopes/:id` | Delete an envelope |
| POST | `/envelopes/transfer/:from/:to` | Move money from one envelope to another |
| POST | `/envelopes/distribute` | Split an amount between several envelopes |

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

## Errors

Errors come back as JSON with an `error` message:

- `400` – invalid input (missing title, negative budget, not enough money, etc.)
- `404` – envelope doesn't exist
