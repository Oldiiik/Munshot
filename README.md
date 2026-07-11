# Moonshot — frontend demo

A frontend-only demo of [Moonshot](https://github.com/): the AI slide-deck studio.
Same landing page and dashboard as the real product, but with **no backend** —
no Supabase, no generation worker. Everything runs client-side:

- **Demo auth** — any email/password signs you in (session kept in localStorage).
- **Seeded decks** — eight sample decks (pitch + edu) built from bundled slide images.
- **Simulated generation** — "Create outline" and "Generate slides" return canned
  results after a short delay so the full brief → outline → slides flow is walkable.
- **Working routes** — `/`, `/signin`, `/register`, `/app`, `/app/community`,
  `/app/insights`, `/app/settings`, `/terms`, `/privacy`, `/refunds`.

## Quick start

```
npm install
npm run dev
```

Open http://localhost:5173 — sign in with any credentials.

## Build

```
npm run build
npm run preview
```

Deploys as a static SPA (a `vercel.json` rewrite serves `index.html` for all paths).
