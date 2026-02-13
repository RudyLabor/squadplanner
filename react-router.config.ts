import type { Config } from '@react-router/dev/config'

let presets: Config['presets'] = []
try {
  const { vercelPreset } = await import('@vercel/react-router')
  if (typeof vercelPreset === 'function') {
    presets = [vercelPreset()]
  }
} catch {
  // vercelPreset not available locally, Vercel handles it at deploy time
}

export default {
  appDirectory: 'src',
  ssr: true,
  async prerender() {
    return ['/', '/auth', '/legal', '/help', '/premium', '/maintenance']
  },
  presets,
} satisfies Config
