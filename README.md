# que website

The source for [que-agents.com](https://que-agents.com): que's docs and downloads, built with
[Astro](https://astro.build) and [Starlight](https://starlight.astro.build). The app itself lives
in [que-agents/que](https://github.com/que-agents/que); report problems with que there, and
problems with the site here.

## Run it

```sh
npm ci            # Node 24 (see .nvmrc)
npm run dev       # the site with hot reload, at http://localhost:4321
```

| Command           | What it does                                                       |
| ----------------- | ------------------------------------------------------------------ |
| `npm run dev`     | Fetch the latest que release, then serve the site with hot reload  |
| `npm run build`   | Fetch the latest que release, then build the site into `dist/`     |
| `npm run check`   | Fetch the latest que release, then type-check with `astro check`   |
| `npm test`        | Unit tests (Vitest): the release script, links, the home animation |
| `npm run lint`    | Lint with oxlint, then check formatting with oxfmt                 |
| `npm run format`  | Format with oxfmt                                                  |
| `npm run preview` | Serve the built `dist/`                                            |

## Where things live

| Path                   | What lives there                                                          |
| ---------------------- | ------------------------------------------------------------------------- |
| `src/content/docs/`    | The pages, in Markdown or MDX; `guides/install.mdx` is `/guides/install/` |
| `astro.config.mjs`     | The site's settings and the sidebar                                       |
| `src/components/`      | Components pages use: the download button, the home page's animation      |
| `src/lib/`             | Plain code the site runs; `day.ts` says what the home animation shows     |
| `src/styles/theme.css` | que's colours and type, mapped onto Starlight's theme                     |
| `scripts/`             | `fetch-release.mjs`, which pulls the release data described below         |
| `tests/`               | Unit tests                                                                |
| `tools/oxlint/`        | The anti-slop oxlint rules, vendored from que; config in `.oxlintrc.json` |

## What comes from que

The download button, the pages under Reference (`/reference/cli/`, `/reference/configuration/`)
and the quiet-mode GIF are not in this repository. `scripts/fetch-release.mjs` fetches them from
the latest que release each time the site is built or served: the release's version, date and
DMG link into `src/data/release.json`, que's `docs/cli.md` and `docs/configuration.md` at that tag
into `src/content/docs/reference/`, and the GIF into `public/images/`. All of them are
gitignored. To change a reference page, change que in
[que-agents/que](https://github.com/que-agents/que); the site picks it up with the next release.

If GitHub cannot be reached, the script keeps the files from the last successful fetch. On a fresh
clone with no network it fails with a message saying so. Set `GITHUB_TOKEN` if the GitHub API
rate-limits you.

## Deploys

`.github/workflows/pages.yml` builds the site and deploys it to GitHub Pages on every push to
`main`, once a day (so a new que release reaches the site without a commit here), and when run by
hand. A pull request builds and deploys nothing. Lint, Typecheck, Unit tests and Semgrep run in
their own workflows on every pull request and push to `main`, and a pull request cannot merge
until they and the build pass.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

Licensed under the [Apache License 2.0](LICENSE).
