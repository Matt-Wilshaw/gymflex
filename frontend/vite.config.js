import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Ensure production build asset URLs match Django's STATIC_URL
  base: '/static/',
  plugins: [react()],
})
