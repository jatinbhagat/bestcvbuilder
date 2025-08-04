import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        result: resolve(__dirname, 'public/result.html'),
        payment: resolve(__dirname, 'public/payment.html'),
        success: resolve(__dirname, 'public/success.html')
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