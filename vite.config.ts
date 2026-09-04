import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/bee-hive-management-/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
