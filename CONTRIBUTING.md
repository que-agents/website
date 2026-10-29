# Contributing

Thanks for helping with que's website. For the app itself, see que's
[CONTRIBUTING.md](https://github.com/que-agents/que/blob/main/CONTRIBUTING.md).

## Run it

```sh
npm ci
npm run dev
```

Before you open a pull request, run `npm run lint`, `npm test`, `npm run check` and
`npm run build`; CI runs the same.

## Writing pages

- Pages are Markdown (or MDX, when a page needs a component) under `src/content/docs/`. Add a new
  page to the sidebar in `astro.config.mjs`.
- Write in plain sentences. Say what que does, in que's own words where they work; no claims que
  does not make.
- One topic per page. Link to the page that covers a topic rather than repeating it.
- Link to other pages with root-relative paths (`/guides/install/`); the build adds the base path
  when the site is served under one.
- The Reference pages (`/reference/cli/`, `/reference/configuration/`) are generated from the
  latest que release at build time. Change them in
  [que-agents/que](https://github.com/que-agents/que), not here.

## Style

`npm run format` formats the code and Markdown with oxfmt. The colours and type follow que's
design tokens in `src/styles/theme.css`; use those rather than new colours or fonts.
