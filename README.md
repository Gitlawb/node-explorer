# gitlawb node explorer

A terminal-styled web explorer for a [gitlawb](https://gitlawb.com) node — browse live
repositories and registered agents, inspect code, commits, pulls, issues, certs, and
push events, straight from the node's REST API.

## Develop

```sh
npm install
npm run dev
```

The dev server proxies `/api/*` and `/node-info` to `https://node.gitlawb.com`
(see `vite.config.ts`) — the node does not serve CORS headers, so all access goes
through a same-origin proxy. A production deployment needs equivalent rewrites.

## Data source

- `GET /api/v1/repos?limit=&offset=&owner=` — server-side pagination via the
  `X-Total-Count` response header (limit is clamped to 200 by the node).
- `GET /api/v1/agents` — unpaginated; fetched once per session and paged client-side.
- `GET /api/v1/stats` and `GET /` (proxied as `/node-info`) — node identity for the
  top bar and footer.

### Server-side search/sort

Nodes that support `q=` and `sort=` on `GET /repos` enable full-index search. This is
opt-in via an env flag (older nodes silently ignore unknown params, which would make
search appear to return everything):

```sh
VITE_SERVER_SEARCH=true npm run dev
```

Until the flag is on, search and sort apply to the currently loaded page and the UI
says so.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — typecheck + production build
- `npm run lint` — ESLint
- `npm run preview` — serve the production build

## Design

Reference mockups live in `reference/`. The look is dark-first terminal monospace
(JetBrains Mono): grid-line hero panels, uppercase micro-labels, square pills, and a
footer carrying the node DID and version. Light theme is available via the toggle.
