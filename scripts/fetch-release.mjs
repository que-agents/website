// Fetches the latest que release and what the site builds from it: the
// download link (src/data/release.json), the CLI and configuration reference
// pages (from que's docs at that tag), and the quiet-mode GIF. Run by
// `npm run dev` and `npm run build`; every output is gitignored.
//
// When a fetch fails, the previous outputs are kept (with a warning) if they
// exist; with none to fall back on, it exits non-zero.
//
//   node scripts/fetch-release.mjs        (GITHUB_TOKEN, when set, is sent to the API)
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { QUE_REPO, pickRelease, transformDoc } from './release-data.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const DOCS = [
  {
    path: 'docs/cli.md',
    out: 'src/content/docs/reference/cli.md',
    title: 'CLI reference',
    description: "Every que command with its options and arguments, from que's own help."
  },
  {
    path: 'docs/configuration.md',
    out: 'src/content/docs/reference/configuration.md',
    title: 'Configuration reference',
    description:
      "Every key of que's config.toml and a repository's que.toml, and the environment variables que reads."
  }
]

const GIF = { path: 'docs/images/quiet-mode.gif', out: 'public/images/quiet-mode.gif' }
const RELEASE_OUT = 'src/data/release.json'
const OUTPUTS = [RELEASE_OUT, ...DOCS.map((doc) => doc.out), GIF.out]

/**
 * @param {string} url
 * @param {Record<string, string>} [headers]
 */
async function get(url, headers = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'que-website-build', ...headers },
    signal: AbortSignal.timeout(30_000)
  })

  if (!res.ok) {
    throw new Error(`GET ${url}: ${res.status} ${res.statusText}`)
  }

  return res
}

async function fetchAll() {
  /** @type {Record<string, string>} */
  const apiHeaders = { Accept: 'application/vnd.github+json' }

  if (process.env.GITHUB_TOKEN) {
    apiHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  const latest = await get(`https://api.github.com/repos/${QUE_REPO}/releases/latest`, apiHeaders)
  const release = pickRelease(await latest.json())

  const raw = (/** @type {string} */ path) =>
    `https://raw.githubusercontent.com/${QUE_REPO}/${release.tag}/${path}`

  const pages = await Promise.all(
    DOCS.map(async (doc) => ({
      out: doc.out,
      content: transformDoc(await (await get(raw(doc.path))).text(), { ...doc, release })
    }))
  )

  const gif = Buffer.from(await (await get(raw(GIF.path))).arrayBuffer())

  return { release, pages, gif }
}

/**
 * @param {string} path relative to the repo root
 * @param {string | Buffer} content
 */
async function write(path, content) {
  const abs = join(root, path)
  await mkdir(dirname(abs), { recursive: true })
  await writeFile(abs, content)
}

try {
  // Everything is fetched before anything is written, so the outputs always come from one release.
  const { release, pages, gif } = await fetchAll()
  await write(RELEASE_OUT, `${JSON.stringify(release, null, 2)}\n`)

  for (const page of pages) {
    await write(page.out, page.content)
  }

  await write(GIF.out, gif)
  console.log(
    `fetch-release: que ${release.version} (${release.tag}), ${OUTPUTS.length} files written`
  )
} catch (error) {
  const reason = error instanceof Error ? error.message : String(error)
  const missing = OUTPUTS.filter((path) => !existsSync(join(root, path)))

  if (missing.length === 0) {
    console.warn(
      `fetch-release: could not fetch the latest que release (${reason}); keeping the previous files.`
    )
  } else {
    console.error(
      `fetch-release: could not fetch the latest que release (${reason}), and there are no previous files to fall back on ` +
        `(missing: ${missing.join(', ')}). ` +
        'The site needs them to build: check the network, or set GITHUB_TOKEN if the API is rate limiting you.'
    )
    process.exitCode = 1
  }
}
