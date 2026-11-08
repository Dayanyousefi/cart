import js from '@eslint/js';
import esbuild from 'esbuild';
import * as espree from 'espree';

/**
 * Custom ESLint 10 parser for TypeScript 7.0 (.ts / .tsx) using esbuild + espree
 */
const tsEsbuildParser = {
  meta: {
    name: 'eyvan-ts7-esbuild-parser',
    version: '1.0.0',
  },
  parseForESLint(code, options) {
    const filePath = options?.filePath || 'file.ts';
    const isTsx = filePath.endsWith('.tsx');
    const transformed = esbuild.transformSync(code, {
      loader: isTsx ? 'tsx' : 'ts',
      jsx: 'transform',
      target: 'es2022',
      format: 'esm',
      sourcemap: false,
    });

    const ast = espree.parse(transformed.code, {
      ecmaVersion: 2022,
      sourceType: 'module',
      loc: true,
      range: true,
      tokens: true,
      comment: true,
    });

    return {
      ast,
      services: {
        rawTypeScriptSource: code,
      },
      scopeManager: null,
      visitorKeys: espree.VisitorKeys,
    };
  },
};

const eyvanTsPlugin = {
  rules: {
    'no-explicit-any': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow explicit any type annotations in TypeScript source',
        },
        messages: {
          unexpectedAny:
            'استفاده از تایپ صریح any مجاز نیست. از تایپ دقیق یا unknown استفاده کنید.',
        },
      },
      create(context) {
        return {
          Program(node) {
            const rawSource =
              context.sourceCode?.parserServices?.rawTypeScriptSource || '';
            const explicitAnyPattern = /(:\s*any\b|\bas\s+any\b|<any>)/;
            if (explicitAnyPattern.test(rawSource)) {
              context.report({
                node,
                messageId: 'unexpectedAny',
              });
            }
          },
        };
      },
    },
  },
};

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.playwright-cli/**',
      'coverage/**',
      'uploads/**',
      'vite.config.ts',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsEsbuildParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: {
      '@eyvan-ts': eyvanTsPlugin,
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      '@eyvan-ts/no-explicit-any': 'error',
    },
  },
];
