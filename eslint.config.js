import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // React hooks — all downgraded to warn for pre-existing codebase
      ...Object.fromEntries(
        Object.entries(reactHooks.configs.recommended.rules ?? {}).map(([k]) => [k, 'warn'])
      ),
      'no-constant-binary-expression': 'warn',
      'no-empty': 'warn',

      // Components in render — warn, not error (pre-existing pattern in codebase)
      'react-refresh/only-export-components': 'off',

      // TypeScript — warn on any/unused so CI doesn't block, but devs see it
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'warn',

      // Security / quality — these stay as errors
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  },
);
