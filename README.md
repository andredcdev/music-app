# Tunely — music app

A Next.js 16 app where signed-in users browse today's most popular songs, play previews, build playlists, and get AI song recommendations.

- **Auth:** email/password via [better-auth](https://better-auth.com), stored in MongoDB.
- **Music data:** [Deezer public API](https://developers.deezer.com/api) (free, no key): charts, search and 30-second MP3 previews.
- **Playlists (CRUD):** stored in MongoDB per user.
- **AI picks:** OpenAI `gpt-5-nano` suggests songs from a form; each suggestion is matched to a playable Deezer track.

| Route | What it does |
|---|---|
| `/login` | Sign in / sign up |
| `/home` | Popular songs + search; click a song to play it (redirects to `/login` when signed out) |
| `/playlists` | Create, rename, delete playlists; remove songs (add songs with ＋ from Home or AI Picks) |
| `/profile` | Update name, avatar and music preferences |
| `/generate` | Recommendation form → list of playable songs |

## 1. Running it locally

**Prerequisites**

- Node.js **20.9 or newer** (developed on Node 24) and npm
- A MongoDB database: a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster or a local `mongod`. If it's a standalone local server without a replica set, see the note below.
- An [OpenAI API key](https://platform.openai.com/api-keys) (only `/generate` needs it)

**Steps**

```bash
git clone https://github.com/andredcdev/music-app.git
cd music-app
npm install
cp .env.example .env      # then fill in the values (see below)
npm run dev               # http://localhost:3000
```

For a production build: `npm run build && npm start`.

**Environment variables** (`.env` in the project root)

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URL` | yes | MongoDB connection string. Data goes into the `music-app` database; collections are created automatically. |
| `BETTER_AUTH_SECRET` | yes | Secret used to sign sessions. Generate one with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | yes | Base URL of the app, e.g. `http://localhost:3000`. |
| `OPENAI_API_KEY` | for `/generate` | Used by the OpenAI SDK for recommendations. |

There's no seed step: open `/login`, click **Sign up**, and create an account.

> **Local MongoDB without a replica set:** the better-auth MongoDB adapter uses transactions by default, and standalone servers don't support them. Either run Mongo as a single-node replica set, or pass `transaction: false` to `mongodbAdapter` in `lib/auth.ts`.

## 2. Architecture and main decisions

It's a single Next.js 16 App Router project with no separate backend. Route handlers under `app/api/*` are the API, and `lib/` holds the server-side modules: `db.ts` (one shared `MongoClient`), `auth.ts` (better-auth config), `deezer.ts` (a typed wrapper around the Deezer API), `store.ts` (preferences and playlist queries) and `session.ts` (session helpers). Auth has two layers. `proxy.ts` (Next 16's new name for middleware) does a cheap cookie check and redirects signed-out users to `/login`, or returns 401 for API calls. Then the `app/(protected)` route-group layout and every API route verify the session against the database, because a cookie alone can be expired or forged. Next 16 turns on Cache Components by default, so each session read sits inside a `<Suspense>` boundary: the page shell renders immediately and the user-specific parts stream in. On the client, a `PlayerProvider` context owns a single `<audio>` element, so playback, the queue and the loading spinner survive navigation between pages.

The main decisions:
- **Deezer for music.** It's free, needs no API key, and returns playable previews. YouTube needs a key and quota, and Spotify has removed preview URLs. Deezer's preview links are signed and expire, so playlists store the track metadata and ID, and playback goes through `/api/music/preview/[id]`, which redirects to a freshly signed URL.
- **CRUD on playlists, not on the music API.** No free music API accepts writes, so the CRUD requirement is met by the user's own playlists of Deezer tracks.
- **AI output as a typed schema.** Recommendations come back validated against a Zod schema (structured outputs), not as free text that has to be parsed. Each suggestion is then resolved against Deezer search. Songs that can't be found, including ones the model invented, are listed separately and never shown as playable.
- **Cheapest model.** `gpt-5-nano` with minimal reasoning was chosen for cost. The form inputs are also saved as the user's preferences, so they pre-fill the form next time.

## 3. What I'd do next with another day

- **Faster playback.** Chart and search results already include valid preview URLs, so play those directly and only use the re-signing redirect for saved playlist tracks. Today every click pays an extra server round trip.
- **Better recommendations.** The nano model sometimes invents songs. I'd ask it for more candidates than needed and keep the first N that match on Deezer, or verify the artist name on each match, or step up to `gpt-5.4-nano` and compare quality against cost.
- **Tests.** Unit tests for `store.ts` against an in-memory MongoDB, route-handler tests for auth and validation, and a Playwright smoke test of sign up → home → play → add to playlist → generate.
- **UX polish.** Busy states on playlist create/rename/delete, toasts instead of `prompt()`/`confirm()`, drag-to-reorder playlist tracks, and pagination of the chart.
- **Hardening.** Rate-limit `/api/generate` per user, add email verification and password reset, cache Deezer responses with `"use cache"`, and add a `.github/workflows` CI job for lint, typecheck and build.

## 4. Use of AI

Most of the code was written with **Claude Code**, Anthropic's AI coding agent, working in the repo from my prompts. I gave it the requirements: free music API, CRUD, MongoDB preferences, better-auth, protected routes, profile page and AI recommendations. It scaffolded the app with `create-next-app`, read the Next.js 16 docs bundled in `node_modules` (this version renames middleware to `proxy.ts` and turns on Cache Components, both newer than most training data), installed the libraries, and wrote the code. It verified its work by running typecheck, lint, `next build`, and an end-to-end `curl` script against the dev server covering sign-up, the auth redirects, every playlist CRUD call, preferences and recommendations.

I steered it as we went, and several decisions came from that back-and-forth. For example, the recommendation endpoint first used Anthropic's API, then I moved it to OpenAI's cheapest model. After trying the app in the browser, I also asked for loading spinners on song playback and playlist loading. AI was also used at runtime, in the product itself: `gpt-5-nano` generates the recommendations on `/generate`.
