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

`npm run dev` intentionally uses Next's webpack dev server. It is the lower-risk
default for this project on laptops where Turbopack has previously consumed too
much memory. To explicitly try Turbopack, run `npm run dev:turbo`.

## Configuration

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Public base URL of the CryptoCheck API. |
