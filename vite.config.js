import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  envPrefix: 'VITE_',
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist'
  }
})