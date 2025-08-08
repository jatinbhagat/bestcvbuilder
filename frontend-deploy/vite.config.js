import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        result: resolve(__dirname, 'result.html'),
        payment: resolve(__dirname, 'payment.html'),
        success: resolve(__dirname, 'success.html')
      },
      output: {
        entryFileNames: `assets/[name]-[hash]-v2.js`,
        chunkFileNames: `assets/[name]-[hash]-v2.js`,
        assetFileNames: `assets/[name]-[hash]-v2.[ext]`
      }
    }
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 4173,
  }
}) 