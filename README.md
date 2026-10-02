# Personal Budget API

A small REST API for envelope budgeting, built with Node.js and Express. You split your money into envelopes (Food, Rent, Fun...), spend from them, and move money between them. The API won't let you spend more than an envelope has.

Data is kept in memory, so it resets when the server restarts.

## Getting started

```bash
npm install
npm start
```

The server runs on http://localhost:3000 (set `PORT` to change it). For auto-reload while developing, use `npm run dev`.

## Endpoints

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/envelopes` | List all envelopes and the total budget |
| POST | `/envelopes` | Create an envelope |
| GET | `/envelopes/:id` | Get one envelope |
| PUT | `/envelopes/:id` | Update an envelope or spend from it |
| DELETE | `/envelopes/:id` | Delete an envelope |
| POST | `/envelopes/transfer/:from/:to` | Move money from one envelope to another |

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

## Errors

Errors come back as JSON with an `error` message:

- `400` – invalid input (missing title, negative budget, not enough money, etc.)
- `404` – envelope doesn't exist
