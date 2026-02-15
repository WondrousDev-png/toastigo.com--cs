import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This part allows frontend to talk to backend seamlessly
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Assuming your server.js runs on 3000
        changeOrigin: true,
        secure: false,
      }
    }
  }
})