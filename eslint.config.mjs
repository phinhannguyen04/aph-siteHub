import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
  { ignores: ['**/dist/**', '**/node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: { 'no-undef': 'off' },
  },
  { files: ['scripts/**/*.ts'], rules: { curly: ['error', 'all'] } },
]
