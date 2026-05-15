# SpendSight API Reference

Base URL (development): `http://localhost:3000`  
Base URL (production): `https://your-app.up.railway.app`

## Authentication

All protected routes require: `Authorization: Bearer <firebase-id-token>`

Get a token by calling `firebase.auth().currentUser.getIdToken()` on the client.

## Health Check

`GET /ping` — No auth required

Response:

```json
{
  "status": "ok",
  "db": "connected",
  "env": "development",
  "timestamp": "2026-04-23T11:44:13.174Z"
}
```

## Transactions

All amounts are stored in **paise** (1 rupee = 100 paise) to avoid float errors.
API accepts amounts in **rupees** and converts internally.

### GET /api/transactions

Query params: `period=today|week|month`, `limit=50`, `offset=0`

### POST /api/transactions

```json
{
  "amount": 450,
  "type": "debit",
  "merchantNormalised": "Swiggy",
  "categoryId": "optional-category-id",
  "txDate": "2026-04-23T11:44:13.174Z",
  "source": "manual",
  "notes": "lunch"
}
```
