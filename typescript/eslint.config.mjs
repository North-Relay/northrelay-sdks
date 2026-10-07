// ESLint 9 flat config for @northrelay/sdk.
//
// Having a config here also stops ESLint from walking up to the platform's
// root eslint.config.mjs (Next.js rules). The SDK used to inherit that file,
// which made `npm run lint` crash.
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tsPlugin.configs['flat/recommended'],
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      // Public request/response types expose `Record<string, any>` metadata;
      // narrowing them to `unknown` would be a breaking change for SDK
      // consumers, so flag `any` without failing the lint run.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
