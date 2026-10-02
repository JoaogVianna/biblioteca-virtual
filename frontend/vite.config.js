import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/livros': 'http://localhost:3000',
      '/usuarios': 'http://localhost:3000',
      '/emprestimos': 'http://localhost:3000',
      '/openlibrary': 'http://localhost:3000',
    },
  },
})