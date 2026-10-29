// Markdown links and images written root-relative (`/guides/install/`) get the
// site's base path, so pages work both at the domain's root and under a
// project path such as GitHub Pages' `/website`. Astro leaves these links as
// written; Starlight's own navigation already adds the base.

/**
 * Prefixes `base` to a root-relative URL; anything else is returned as is.
 * @param {string} url
 * @param {string} base
 */
export function withBase(url, base) {
  const prefix = base.replace(/\/+$/, '')
  if (
    prefix === '' ||
    !url.startsWith('/') ||
    url.startsWith('//') ||
    url === prefix ||
    url.startsWith(`${prefix}/`)
  ) {
    return url
  }

  return prefix + url
}

/**
 * The Astro integration. It adds a plugin to Astro's Markdown processor
 * (Sätteri, Astro's default) once the final base is known, `--base` included,
 * the same way Starlight adds its own Markdown plugins.
 * @returns {import('astro').AstroIntegration}
 */
export function baseLinks() {
  return {
    name: 'que:base-links',
    hooks: {
      'astro:config:setup': ({ config, logger }) => {
        const processor = /** @type {{ name: string, options: { mdastPlugins: object[] } }} */ (
          config.markdown.processor
        )
        if (processor.name !== 'satteri') {
          logger.warn(
            `Markdown links will not get the base path: the "${processor.name}" processor is not supported.`
          )
          return
        }
        /**
         * @param {{ url: string }} node
         * @param {{ setProperty: (node: { url: string }, key: 'url', value: string) => void }} ctx
         */
        const rewrite = (node, ctx) => {
          const url = withBase(node.url, config.base)
          if (url !== node.url) {
            ctx.setProperty(node, 'url', url)
          }
        }
        processor.options.mdastPlugins.push({
          name: 'que-base-links',
          link: rewrite,
          image: rewrite,
          definition: rewrite
        })
      }
    }
  }
}
