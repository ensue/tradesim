import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, 'src/config', '')
  
  return {
    plugins: [react()],
    envDir: 'src/config',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    }
  }
})
