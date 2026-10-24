const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/**', 'coverage/**', 'build/**', 'test-results/**'] },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'src/test/**/*'],
    languageOptions: {
      globals: {
        jest: 'readonly', describe: 'readonly', it: 'readonly', expect: 'readonly',
        beforeEach: 'readonly', afterEach: 'readonly', afterAll: 'readonly',
      },
    },
  },
]);
