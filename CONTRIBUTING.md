# Contributing to gitlawb node explorer

Thanks for your interest in contributing! This document covers how to get set up,
the conventions the codebase follows, and what to expect from the review process.

## Getting started

1. Fork the repository and clone your fork.
2. Install dependencies and start the dev server:

   ```sh
   npm install
   npm run dev
   ```

   Requires Node.js 20+. The dev server proxies API calls to
   `https://node.gitlawb.com` — no backend setup needed.

3. Create a branch off `main` for your change:

   ```sh
   git checkout -b feat/short-description
   ```

## Before you open a PR

Run the full check suite locally — CI runs the same three commands:

```sh
npm run lint
npm test
npm run build
```

All three must pass. `npm run build` includes the TypeScript project build
(`tsc -b`), so type errors fail there.

## What makes a good PR

- **Keep it focused.** One logical change per PR. Refactors, formatting sweeps, and
  behavior changes belong in separate PRs.
- **Add tests for logic.** New pure functions in `src/lib/` should ship with a
  colocated `*.test.ts` file. Bug fixes should include a test that fails without
  the fix.
- **Match the surrounding style.** The codebase favors small framework-free modules
  in `src/lib/`, hooks in `src/hooks/`, and presentational components that receive
  data via props. Comments explain *why*, not *what*.
- **Mind the bundle.** `marked` and `shiki` are lazy-loaded on purpose — don't
  import them (directly or transitively) from modules used by the page entry.
  `src/lib/lang.ts` exists specifically to keep detection separate from rendering.
- **Screenshots for UI changes.** The PR template asks for before/after screenshots
  of any visual change, in both dark and light themes if the change touches themed
  surfaces.

## Testing guidelines

- Tests run on [Vitest](https://vitest.dev); the default environment is `node`.
- If a test needs the DOM, add `// @vitest-environment jsdom` as the first line of
  the file rather than switching the global environment.
- Stub the network with `vi.stubGlobal('fetch', …)` — tests must not hit a real
  node.
- Time-dependent code (e.g. `timeAgo`) should be tested with
  `vi.useFakeTimers()` + `vi.setSystemTime(…)`.

## Commit messages

Use concise, imperative subject lines (`Add line-range permalinks to file viewer`).
Conventional-commit prefixes (`feat:`, `fix:`, `docs:`, `test:`, `chore:`) are
welcome but not required.

## Reporting bugs and proposing features

Open a [GitHub issue](https://github.com/Gitlawb/node-explorer/issues) with:

- what you expected vs. what happened,
- steps to reproduce (including the node you were pointed at, if not the default),
- browser and OS for rendering issues.

For larger features, please open an issue to discuss the approach before investing
in an implementation — it saves everyone time if the direction is agreed on first.

## Code of conduct

Be kind and constructive. By participating you agree to uphold the
[Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](LICENSE).
