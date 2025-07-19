import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
  {
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',

      // React specific rules
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/exhaustive-deps': 'off',

      // General code quality rules
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off',
      'no-debugger': 'error',

      // Import rules (temporarily disabled for build)
      'import/order': 'off',
    },
  },
];

export default eslintConfig;
