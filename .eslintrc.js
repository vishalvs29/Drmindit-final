module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended'
  ],
  ignorePatterns: ['dist', 'node_modules', '.turbo', '.next', '.expo'],
  env: {
    node: true,
    browser: true
  },
  rules: {
    'no-unused-vars': 'off',
    'no-undef': 'off'
  }
};
