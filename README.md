# CryptoCheck Client

Next.js client for CryptoCheck.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. In local development, the `/api` rewrite forwards
requests to `http://localhost:8080` by default.

`npm run dev` intentionally uses Next's webpack dev server. It is the lower-risk
default for this project on laptops where Turbopack has previously consumed too
much memory. To explicitly try Turbopack, run `npm run dev:turbo`.

## Configuration

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Optional public API base URL. Leave it unset for a same-domain production deployment so browser requests stay on `/api`. |
| `API_INTERNAL_URL` | Optional server-side API URL used by Next's `/api` rewrite. In Docker production it defaults to `http://backend-api:8080`; locally it defaults to `http://localhost:8080`. |

For the split Docker deployment, build the frontend without a
`NEXT_PUBLIC_API_URL` value unless the API is deliberately hosted on another
public origin. This prevents a compiled browser bundle from calling
`http://localhost:8080` on each visitor's computer.
