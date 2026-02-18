import type { Config } from '@react-router/dev/config'

let presets: Config['presets'] = []
try {
  const mod = await import('@vercel/react-router') as any
  if (typeof mod.vercelPreset === 'function') {
    presets = [mod.vercelPreset()]
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
