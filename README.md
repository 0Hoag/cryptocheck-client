# CryptoCheck Client

Next.js client for CryptoCheck.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. By default the client calls the API at
`http://localhost:8080`.

## Configuration

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Public base URL of the CryptoCheck API. |
