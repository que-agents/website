import { describe, expect, it } from 'vitest'
import { mapLinks, pickRelease, rewriteLink, transformDoc } from '../scripts/release-data.mjs'

// A trimmed GitHub "latest release" response, in the shape the API returns.
const latest = {
  tag_name: 'v0.2.0',
  html_url: 'https://github.com/que-agents/que/releases/tag/v0.2.0',
  published_at: '2026-10-28T23:41:02Z',
  assets: [
    {
      name: 'latest-mac.yml',
      size: 485,
      browser_download_url:
        'https://github.com/que-agents/que/releases/download/v0.2.0/latest-mac.yml'
    },
    {
      name: 'que-0.2.0-arm64.dmg',
      size: 131243582,
      browser_download_url:
        'https://github.com/que-agents/que/releases/download/v0.2.0/que-0.2.0-arm64.dmg'
    },
    {
      name: 'que-0.2.0-arm64.zip',
      size: 127146274,
      browser_download_url:
        'https://github.com/que-agents/que/releases/download/v0.2.0/que-0.2.0-arm64.zip'
    }
  ]
}

const release = {
  tag: 'v0.2.0',
  version: '0.2.0',
  url: 'https://github.com/que-agents/que/releases/tag/v0.2.0'
}

describe('pickRelease', () => {
  it('takes the tag, the version without its v, the date, the page and the arm64 DMG', () => {
    expect(pickRelease(latest)).toEqual({
      tag: 'v0.2.0',
      version: '0.2.0',
      publishedAt: '2026-10-28T23:41:02Z',
      url: 'https://github.com/que-agents/que/releases/tag/v0.2.0',
      dmg: {
        name: 'que-0.2.0-arm64.dmg',
        url: 'https://github.com/que-agents/que/releases/download/v0.2.0/que-0.2.0-arm64.dmg',
        size: 131243582
      }
    })
  })

  it('keeps a prerelease suffix in the version', () => {
    const beta = {
      ...latest,
      tag_name: 'v0.3.0-beta.1',
      assets: [
        {
          name: 'que-0.3.0-beta.1-arm64.dmg',
          size: 1,
          browser_download_url: 'https://example.test/q.dmg'
        }
      ]
    }

    expect(pickRelease(beta).version).toBe('0.3.0-beta.1')
  })

  it('fails when the release has no arm64 DMG', () => {
    const noDmg = {
      ...latest,
      assets: latest.assets.filter((asset) => !asset.name.endsWith('.dmg'))
    }

    expect(() => pickRelease(noDmg)).toThrow('release v0.2.0 has no asset ending in -arm64.dmg')
  })

  it('fails when the response has no tag', () => {
    expect(() => pickRelease({ message: 'Not Found' })).toThrow('the release has no tag_name')
  })
})

describe('rewriteLink', () => {
  const from = { fromPath: 'docs/configuration.md', tag: 'v0.2.0' }

  it('points a link to another doc with a site page at that page, keeping the anchor', () => {
    expect(rewriteLink('cli.md', from)).toBe('/reference/cli/')
    expect(rewriteLink('./cli.md#que-work', from)).toBe('/reference/cli/#que-work')
    expect(rewriteLink('../docs/configuration.md', from)).toBe('/reference/configuration/')
  })

  it('points a link to any other repo file at GitHub, at the tag', () => {
    expect(rewriteLink('../README.md#install', from)).toBe(
      'https://github.com/que-agents/que/blob/v0.2.0/README.md#install'
    )
    expect(rewriteLink('design.md', from)).toBe(
      'https://github.com/que-agents/que/blob/v0.2.0/docs/design.md'
    )
    expect(rewriteLink('../src/shared/config.ts', from)).toBe(
      'https://github.com/que-agents/que/blob/v0.2.0/src/shared/config.ts'
    )
  })

  it('points an image at the raw file, at the tag', () => {
    expect(rewriteLink('images/quiet-mode.gif', { ...from, image: true })).toBe(
      'https://raw.githubusercontent.com/que-agents/que/v0.2.0/docs/images/quiet-mode.gif'
    )
  })

  it('leaves anchors, absolute URLs and root-relative paths alone', () => {
    for (const target of [
      '#instructions',
      'https://example.test/x.md',
      'mailto:a@example.test',
      '/reference/cli/'
    ]) {
      expect(rewriteLink(target, from)).toBe(target)
    }
  })
})

describe('mapLinks', () => {
  const upper = (target: string) => target.toUpperCase()

  it('rewrites inline links, images and reference definitions', () => {
    const markdown = [
      'See [the CLI](cli.md) and ![a gif](images/a.gif "Quiet").',
      '',
      '[ref]: design.md'
    ].join('\n')

    expect(mapLinks(markdown, upper)).toBe(
      ['See [the CLI](CLI.MD) and ![a gif](IMAGES/A.GIF "Quiet").', '', '[ref]: DESIGN.MD'].join(
        '\n'
      )
    )
  })

  it('rewrites a link whose label is inline code', () => {
    expect(mapLinks('Run [`que doctor`](cli.md#que-doctor) first.', upper)).toBe(
      'Run [`que doctor`](CLI.MD#QUE-DOCTOR) first.'
    )
  })

  it('leaves inline code, fenced code and footnotes alone', () => {
    const markdown = [
      'Write `[x](y.md)` literally.',
      '',
      '```md',
      '[x](y.md)',
      '```',
      '',
      '[^1]: a footnote',
      '[after](z.md)'
    ].join('\n')

    expect(mapLinks(markdown, upper)).toBe(
      [
        'Write `[x](y.md)` literally.',
        '',
        '```md',
        '[x](y.md)',
        '```',
        '',
        '[^1]: a footnote',
        '[after](Z.MD)'
      ].join('\n')
    )
  })
  it('keeps a document that starts with a fence, or has fences back to back, line for line', () => {
    const markdown = [
      '```sh',
      'que doctor',
      '```',
      '~~~text',
      '[x](y.md)',
      '~~~',
      '[z](z.md)'
    ].join('\n')

    expect(mapLinks(markdown, upper)).toBe(
      ['```sh', 'que doctor', '```', '~~~text', '[x](y.md)', '~~~', '[z](Z.MD)'].join('\n')
    )
  })
})

describe('transformDoc', () => {
  // The head of que's docs/cli.md: an H1, the generated-by paragraph, then content.
  const cli = [
    '# que CLI reference',
    '',
    'Generated by `scripts/cli-reference.mjs` from `que --help` (que 0.2.0). Do not edit by',
    'hand; run `npm run docs` after changing a command.',
    '',
    '| Command | What it does |',
    '| --- | --- |',
    '| `que doctor [options]` | check the daemon |',
    '',
    '## Details',
    '',
    '### que doctor',
    '',
    '```text',
    'Usage: que doctor [options]',
    '',
    '# not a heading',
    '```',
    ''
  ].join('\n')

  // The shape of que's docs/configuration.md: generated blocks between comment markers.
  const configuration = [
    '# Configuration',
    '',
    'que reads two TOML files. See [the CLI](cli.md#que-config-set) and [Instructions](#instructions).',
    '',
    '_Generated:_',
    '',
    '<!-- generated:config-defaults -->',
    '',
    '```toml',
    '# ~/.config/que/config.toml',
    'worktree_root = "~/.que/worktrees"',
    '```',
    '',
    '<!-- /generated -->',
    '',
    '## Instructions',
    '',
    'More in [the design notes](design.md).',
    ''
  ].join('\n')

  const options = { title: 'CLI reference', description: 'Every que command.', release }

  it('writes Starlight frontmatter with no edit link, then the release note', () => {
    const page = transformDoc(cli, { ...options, path: 'docs/cli.md' })
    expect(
      page.startsWith(
        [
          '---',
          'title: "CLI reference"',
          'description: "Every que command."',
          'editUrl: false',
          '---',
          '',
          "_Generated from [que 0.2.0](https://github.com/que-agents/que/releases/tag/v0.2.0). To change it, edit que's source in [que-agents/que](https://github.com/que-agents/que)._",
          '',
          '| Command | What it does |'
        ].join('\n')
      )
    ).toBe(true)
  })

  it('drops the H1 and the generated-by paragraph but keeps code that looks like a heading', () => {
    const page = transformDoc(cli, { ...options, path: 'docs/cli.md' })
    expect(page).not.toContain('# que CLI reference')
    expect(page).not.toContain('Do not edit')
    expect(page).toContain('## Details')
    expect(page).toContain('# not a heading')
    expect(page.endsWith('```\n')).toBe(true)
  })

  it('drops the generated-block markers and rewrites links', () => {
    const page = transformDoc(configuration, { ...options, path: 'docs/configuration.md' })
    expect(page).not.toContain('<!--')
    expect(page).toContain('_Generated:_\n\n```toml\n# ~/.config/que/config.toml')
    expect(page).toContain('```\n\n## Instructions')
    expect(page).toContain('[the CLI](/reference/cli/#que-config-set)')
    expect(page).toContain('[Instructions](#instructions)')
    expect(page).toContain(
      '[the design notes](https://github.com/que-agents/que/blob/v0.2.0/docs/design.md)'
    )
  })

  it('quotes a title that YAML would otherwise misread', () => {
    const page = transformDoc(cli, { ...options, path: 'docs/cli.md', title: 'que: the CLI' })
    expect(page).toContain('title: "que: the CLI"')
  })
})
