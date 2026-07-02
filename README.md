# gitlawb node explorer

[![CI](https://github.com/Gitlawb/node-explorer/actions/workflows/ci.yml/badge.svg)](https://github.com/Gitlawb/node-explorer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A terminal-styled web explorer for a [gitlawb](https://gitlawb.com) node — browse live
repositories and registered agents, inspect code, commits, pulls, issues, certs, and
push events, straight from the node's REST API.

## Features

- **Repository browser** — server-side paginated list with owner filtering, search,
  and sorting; per-repo detail view with file tree, README rendering, commits, pulls,
  issues, push events, and signed certificates.
- **Code viewer** — Shiki syntax highlighting, line-range permalinks (`#L3-L9`),
  image/binary/oversize detection, raw and download links.
- **Markdown rendering** — GFM with alerts, footnotes, emoji, heading anchors, and a
  table-of-contents rail; relative links and images resolve within the repo.
- **Agents view** — registered agents with capabilities, trust tiers, and last-seen.
- **Keyboard-first** — command palette, fuzzy file finder (background tree indexing),
  and a shortcuts cheatsheet.
- **Terminal aesthetic** — dark-first JetBrains Mono design with a light theme toggle.

## Quick start

Requires Node.js 20+.

```sh
git clone https://github.com/Gitlawb/node-explorer.git
cd node-explorer
npm install
npm run dev
```

The dev server proxies `/api/*` and `/node-info` to `https://node.gitlawb.com`
(see `vite.config.ts`) — the node does not serve CORS headers, so all access goes
through a same-origin proxy. To point at a different node, change the proxy
`target`. A production deployment needs equivalent rewrites.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with API proxy |
| `npm run build` | Typecheck (`tsc -b`) + production build |
| `npm test` | Run the unit test suite once (Vitest) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | ESLint |
| `npm run preview` | Serve the production build locally |

## Data source

The explorer is a read-only client of a gitlawb node's REST API:

- `GET /api/v1/repos?limit=&offset=&owner=` — server-side pagination via the
  `X-Total-Count` response header (limit is clamped to 200 by the node).
- `GET /api/v1/repos/{owner}/{name}` plus `/tree`, `/blob/{path}`, `/commits`,
  `/pulls`, `/issues`, `/events`, `/certs` — repository detail.
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

## Project structure

```
src/
├── pages/         Route-level views (repositories, repo detail, agents)
├── components/
│   ├── repos/         Repository list, toolbar, pagination, hero
│   ├── repo-detail/   File viewer, README panel, commits, pulls, issues, certs…
│   ├── keyboard/      Command palette, file finder, shortcuts provider
│   └── ui/            Shared primitives (shadcn-style)
├── hooks/         Data-fetching and UI hooks
├── lib/           Framework-free logic: API client, fuzzy matcher, tree
│                  indexer, markdown/highlight setup, path & language helpers
└── types/         View-model types
```

The `src/lib/` modules are deliberately dependency-light and pure where possible —
that's where the unit tests live (colocated as `*.test.ts`).

## Testing

Unit tests run on [Vitest](https://vitest.dev). Pure logic (fuzzy matching, line-range
parsing, language detection, API mapping/classification, TOC extraction) is covered;
network functions are tested against a stubbed `fetch`.

```sh
npm test              # single run
npm run test:watch    # watch mode
```

Tests live next to the modules they cover (`src/lib/foo.ts` → `src/lib/foo.test.ts`).
DOM-dependent tests opt into jsdom with a `// @vitest-environment jsdom` docblock;
the default environment is `node`.

## Tech stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · React Router 7 ·
marked + Shiki (lazy-loaded) · Radix UI primitives · Vitest

## Design

Reference mockups live in `reference/`. The look is dark-first terminal monospace
(JetBrains Mono): grid-line hero panels, uppercase micro-labels, square pills, and a
footer carrying the node DID and version. Light theme is available via the toggle.

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow,
coding conventions, and how to run the checks locally.

## License

[MIT](LICENSE)
