// @ts-check
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import { baseLinks } from './src/lib/base-links.mjs'

// CI passes the real origin and base path with `astro build --site … --base …`.
export default defineConfig({
  site: 'https://que-agents.com',
  integrations: [
    starlight({
      title: 'que',
      description:
        'que is a macOS app for running Claude Code sessions in git worktrees that also puts a boundary around them.',
      favicon: '/favicon.svg',
      logo: { light: './src/assets/que-mark-light.svg', dark: './src/assets/que-mark-dark.svg' },
      components: { Search: './src/components/Search.astro' },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/que-agents/que' }],
      editLink: { baseUrl: 'https://github.com/que-agents/website/edit/main/' },
      customCss: ['./src/styles/theme.css'],
      expressiveCode: { styleOverrides: { borderRadius: '4px' } },
      sidebar: [
        {
          label: 'Start here',
          items: ['guides/overview', 'guides/install', 'guides/first-run']
        },
        {
          label: 'Using que',
          items: ['guides/quiet-mode', 'guides/configuration', 'guides/cli']
        },
        {
          label: 'Reference',
          items: [
            { label: 'CLI reference', slug: 'reference/cli' },
            { label: 'Configuration reference', slug: 'reference/configuration' }
          ]
        }
      ]
    }),
    baseLinks()
  ]
})
