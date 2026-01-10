import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import packageJson from './package.json'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    base: './',
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
      __REMOTE_VERSION_URL__: JSON.stringify(env.VITE_REMOTE_VERSION_URL || ''),
    },
  }
})
