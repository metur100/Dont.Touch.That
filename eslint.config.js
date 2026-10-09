// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const nodeGlobals = {
  __dirname: 'readonly',
  Buffer: 'readonly',
  console: 'readonly',
  module: 'writable',
  process: 'readonly',
  require: 'readonly',
};

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'android/*', 'ios/*', '.expo/*', 'coverage/*'],
  },
  {
    files: ['scripts/**/*.js', 'plugins/**/*.js', '*.config.js', 'jest.setup.js'],
    languageOptions: { globals: nodeGlobals },
  },
]);
