import js from '@eslint/js'
import globals from 'globals'

export default [
  { ignores: ['**/dist/**', '**/node_modules/**'] },
  js.configs.recommended,
  { files: ['scripts/**/*.mjs'], languageOptions: { globals: globals.node }, rules: { curly: ['error', 'all'] } },
]
