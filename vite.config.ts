import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    license: { fileName: 'dependency-licenses.md' },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
