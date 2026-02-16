import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env from this project folder so it works no matter where you run npm run dev from
function loadEnvFromProjectRoot(): Record<string, string> {
  const envPath = path.join(__dirname, '.env')
  try {
    let content = readFileSync(envPath, 'utf-8')
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const out: Record<string, string> = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const eq = trimmed.indexOf('=')
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim().replace(/\s/g, '')
          const value = trimmed.slice(eq + 1).trim().replace(/\r/g, '')
          if (key.startsWith('VITE_')) out[key] = value
        }
      }
    }
    return out
  } catch (e) {
    console.error('[Vite] .env read failed:', e)
    return {}
  }
}

const envFromFile = loadEnvFromProjectRoot()
// Use process.env so Vercel (and other hosts) can inject VITE_* at build time
const env = {
  VITE_SUPABASE_URL: envFromFile.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY: envFromFile.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      devOptions: { enabled: false },
      manifest: {
        name: 'Dublin Fuel Prices',
        short_name: 'Fuel Prices',
        description: 'Community-reported fuel prices for Dublin — report what you see at the pump',
        theme_color: '#1a1a1a',
        background_color: '#0f0f0f',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  envDir: __dirname,
  define: {
    __SUPABASE_URL__: JSON.stringify(env.VITE_SUPABASE_URL || ''),
    __SUPABASE_ANON_KEY__: JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
  },
})
