import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/build/**',
        '**/__tests__/**',
        '**/test/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    testTimeout: 15000,
    hookTimeout: 15000,
    teardownTimeout: 5000,
    isolate: false,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@cowors/shared-types': resolve(__dirname, '../shared-types/src')
    }
  },
  define: {
    'process.env.NODE_ENV': '"test"',
    'process.env.NEXTAUTH_SECRET': '"test-secret"',
    'process.env.NEXTAUTH_URL': '"http://localhost:3000"',
    'process.env.NEXT_PUBLIC_API_URL': '"http://localhost:5001"'
  }
})