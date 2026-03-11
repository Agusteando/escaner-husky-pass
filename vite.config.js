import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { execSync } from 'node:child_process'

const getGitCommitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch (error) {
    return 'unknown'
  }
}

export default defineConfig({
  plugins: [vue()],
  envPrefix: 'VITE_',
  define: {
    __APP_COMMIT_HASH__: JSON.stringify(getGitCommitHash())
  },
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist'
  }
})

