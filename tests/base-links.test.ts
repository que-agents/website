import { describe, expect, it } from 'vitest'
import { withBase } from '../src/lib/base-links.mjs'

describe('withBase', () => {
  it('prefixes the base to a root-relative link', () => {
    expect(withBase('/guides/install/#first-launch', '/website')).toBe(
      '/website/guides/install/#first-launch'
    )
    expect(withBase('/images/quiet-mode.gif', '/website/')).toBe('/website/images/quiet-mode.gif')
  })

  it('changes nothing when the site is at the root', () => {
    expect(withBase('/guides/install/', '/')).toBe('/guides/install/')
    expect(withBase('/guides/install/', '')).toBe('/guides/install/')
  })

  it('leaves relative, absolute, protocol-relative and already-prefixed links alone', () => {
    for (const url of [
      '../install/',
      '#first-launch',
      'https://github.com/que-agents/que',
      '//cdn.example.test/x',
      '/website/guides/'
    ]) {
      expect(withBase(url, '/website')).toBe(url)
    }
  })
})
