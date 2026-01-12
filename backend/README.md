# Quantraider Backend (FastAPI + MongoDB)

This backend provides:
- user registration/login (JWT)
- protected finance data endpoints (per-user)
- optional CSV import endpoints

## Local dev (with port-forward)

> Note: Password hashing uses **argon2** (via `passlib` + `argon2-cffi`) to avoid
> bcrypt/passlib compatibility issues that can occur on some Python versions.

1) Port-forward MongoDB from your cluster:

```bash
kubectl -n <namespace> port-forward svc/<mongo-service> 27017:27017
```

2) Start API:

```bash
cd backend
cp .env.example .env
# set MONGO_URI=mongodb://localhost:27017
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

## Local dev (with Docker Mongo)

1) Start MongoDB:

```bash
docker run -d --name mongo \
	-p 27017:27017 \
	-v mongo_data:/data/db \
	mongo:7
```

2) Start API:

```bash
cd backend
cp .env.example .env
# set MONGO_URI=mongodb://127.0.0.1:27017
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

3) Quick smoke test:

```bash
curl -s http://127.0.0.1:8000/health

curl -s -X POST http://127.0.0.1:8000/auth/register \
	-H 'Content-Type: application/json' \
	-d '{"email":"demo@example.com","password":"demo12345"}'

TOKEN=$(curl -s -X POST http://127.0.0.1:8000/auth/login \
	-H 'Content-Type: application/json' \
	-d '{"email":"demo@example.com","password":"demo12345"}' \
	| python3 -c 'import sys, json; print(json.load(sys.stdin)["access_token"])')

curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/v1/finance/me

curl -s -X PUT http://127.0.0.1:8000/v1/finance/me \
	-H "Authorization: Bearer $TOKEN" \
	-H 'Content-Type: application/json' \
	-d '{"data":{"note":"hello-mongo","netWorth":{},"incomes":{},"expenses":{}}}'
```

## Auth flow (JWT)

Register:

```bash
curl -s -X POST http://localhost:8000/auth/register \
	-H 'content-type: application/json' \
	-d '{"email":"you@example.com","password":"supersecret123"}'
```

Login:

```bash
curl -s -X POST http://localhost:8000/auth/login \
	-H 'content-type: application/json' \
	-d '{"email":"you@example.com","password":"supersecret123"}'
```

Then call protected routes with header:

```bash
Authorization: Bearer <access_token>
```

## Finance endpoints

- `GET /v1/finance/me`
- `PUT /v1/finance/me` body: `{ "data": { ... } }`
- `POST /v1/finance/me/import/incomes` (multipart CSV: date,name,amount,currency?)

## Config

See `.env.example`.
