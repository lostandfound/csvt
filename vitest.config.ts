import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // Use global APIs like describe, it
    environment: 'node', // Specify the test environment
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'], // Report formats
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts', // Usually just exports, no logic to test directly
        'src/types.ts', // Typically just type definitions
        'node_modules/',
        'dist/',
        'tests/'
      ],
      all: true, // Include uncovered files in the report
      thresholds: {
        lines: 80, // Minimum line coverage percentage
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
}); 