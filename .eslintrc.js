module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended'
  ],
  ignorePatterns: ['dist', 'node_modules', '.turbo', '.next', '.expo'],
  env: {
    node: true,
    browser: true
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-unused-expressions': 'off'
  }
};
