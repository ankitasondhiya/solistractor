import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Honour an assigned port so this can run beside the Hitachi dev server,
  // which already holds 5173.
  server: {
    port: 5174,
  },
})
