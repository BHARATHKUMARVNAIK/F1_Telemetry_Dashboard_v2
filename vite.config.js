
/*
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()], base: './', build: { outDir: 'dist' } })
*/

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/F1_Telemetry_Dashboard_v2/',
  build: {
    outDir: 'dist',
  },
})
