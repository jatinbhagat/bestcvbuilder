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
        success: resolve(__dirname, 'success.html'),
        download: resolve(__dirname, 'download-report.html'),
        order: resolve(__dirname, 'create-order.html'),
        paymentSuccess: resolve(__dirname, 'payment-success.html'),
        paymentFailure: resolve(__dirname, 'payment-failure.html')
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