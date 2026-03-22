import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import perfectionist from 'eslint-plugin-perfectionist';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import tsEslint from 'typescript-eslint';

const maxLenIgnorePattern = [
    // imports
    'import\\s.*',
    'import\\([^)]+',
    'export\\s.*',

    // other
    'href:\\s.*',
].join('|');

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    // Override default ignores of eslint-config-next.
    globalIgnores([
    // Default ignores of eslint-config-next:
        '.next/**',
        'out/**',
        'build/**',
        'next-env.d.ts',
        'prisma/generated/**',
        'node_modules/**',
    ]),

    eslint.configs.recommended,
    tsEslint.configs.strictTypeChecked,
    tsEslint.configs.stylisticTypeChecked,
    reactHooks.configs.flat.recommended,

    {
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
    },

    {
        files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
        plugins: {
            reactPlugin,
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
    },

    {
        plugins: {
            perfectionist,
            '@stylistic': stylistic,
        },
        rules: {
            'perfectionist/sort-jsx-props': [
                'error',
                {
                    type: 'unsorted',
                    groups: [
                        'key',
                        'ref',
                        'className',
                        'unknown',
                        'dataAttribute',
                        'callback',
                    ],
                    customGroups: [
                        {
                            groupName: 'key',
                            elementNamePattern: '^key$',
                        },
                        {
                            groupName: 'ref',
                            elementNamePattern: '^ref$|.*Ref$|.*[rR]eference$',
                        },
                        {
                            groupName: 'className',
                            elementNamePattern: '.*[cC]lassName.*',
                        },
                        {
                            groupName: 'dataAttribute',
                            elementNamePattern: '^dataQaId$|^data-.*',
                        },
                        {
                            groupName: 'callback',
                            elementNamePattern: '^on.+',
                        },
                    ],
                },
            ],

            '@stylistic/indent': ['error', 4],

            'space-infix-ops': 'error',

            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: [
                        'class',
                        'enum',
                        'interface',
                        'typeAlias',
                        'typeParameter',
                        'enumMember',
                    ],
                    format: ['PascalCase'],
                },
                {
                    selector: ['parameter'],
                    format: ['camelCase'],
                    leadingUnderscore: 'allow',
                },
                {
                    selector: ['function'],
                    format: ['camelCase', 'PascalCase'],
                },
                {
                    selector: ['classProperty', 'classMethod'],
                    modifiers: ['public'],
                    format: ['camelCase'],
                },
                {
                    selector: ['classProperty', 'classMethod'],
                    modifiers: ['private', 'protected'],
                    format: ['camelCase'],
                    leadingUnderscore: 'require',
                },
                {
                    selector: 'variable',
                    modifiers: ['const'],
                    format: [
                        'camelCase',
                        'UPPER_CASE',
                    ],
                    leadingUnderscore: 'forbid',
                    trailingUnderscore: 'forbid',
                },
                {
                    selector: 'variable',
                    format: ['camelCase'],
                    leadingUnderscore: 'forbid',
                    trailingUnderscore: 'forbid',
                },
            ],
            '@typescript-eslint/array-type': 'error',
            '@stylistic/brace-style': ['error', '1tbs', {
                allowSingleLine: false,
            }],
            '@stylistic/member-delimiter-style': 'error',
            '@typescript-eslint/no-shadow': ['error', {
                ignoreFunctionTypeParameterNameValueShadow: true,
                ignoreTypeValueShadow: true,
                ignoreOnInitialization: true,
            }],
            '@stylistic/object-curly-spacing': ['error', 'always'],
            '@stylistic/semi': 'error',
            '@stylistic/space-before-function-paren': [
                'error',
                {
                    anonymous: 'always',
                    asyncArrow: 'always',
                    named: 'never',
                },
            ],
            '@typescript-eslint/ban-ts-comment': 'error',
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
            '@typescript-eslint/no-empty-interface': 'error',
            'arrow-parens': 'error',
            'comma-dangle': ['error', 'always-multiline'],
            'guard-for-in': 'error',
            '@stylistic/new-parens': 'error',
            'no-duplicate-imports': 'error',
            'no-new-wrappers': 'error',
            curly: ['error', 'all'],
            'dot-notation': ['error', { allowKeywords: true }],
            eqeqeq: ['error', 'smart'],
            'eol-last': 'error',
            'no-caller': 'error',
            'no-eval': 'error',
            'no-extra-bind': 'error',
            'no-extra-semi': 'error',
            'no-inner-declarations': 'error',
            '@stylistic/no-multi-spaces': 'error',
            'no-new-func': 'error',
            '@typescript-eslint/return-await': 'error',
            'no-sequences': ['error', { allowInParentheses: false }],
            'no-throw-literal': 'error',
            '@stylistic/no-trailing-spaces': 'error',
            'no-undef-init': 'error',
            'no-unused-expressions': ['error', { allowTernary: true }],
            'one-var': ['error', 'never'],
            '@stylistic/padded-blocks': ['error', 'never'],
            'prefer-const': 'error',
            '@stylistic/quote-props': [
                'error',
                'as-needed',
                { keywords: false, unnecessary: true, numbers: false },
            ],
            '@stylistic/spaced-comment': [
                'error',
                'always',
                { exceptions: ['-', '+'], markers: ['=', '!', '/', '*'] },
            ],
            '@stylistic/space-in-parens': 'error',
            '@stylistic/type-annotation-spacing': 'error',
            '@typescript-eslint/method-signature-style': ['error', 'property'],
            'jsx-quotes': ['error', 'prefer-double'],
            '@stylistic/jsx-curly-spacing': ['error', {
                when: 'always',
                children: { when: 'always' },
            }],
            '@stylistic/jsx-equals-spacing': 'error',
            '@stylistic/jsx-wrap-multilines': 'error',
            'react/jsx-curly-newline': 'error',
            'react/jsx-first-prop-new-line': ['error', 'multiline'],
            'react/jsx-curly-brace-presence': [
                'error',
                {
                    props: 'never',
                },
            ],
            '@stylistic/arrow-spacing': ['error', { before: true, after: true }],
            '@stylistic/keyword-spacing': ['error', { before: true, after: true }],
            '@stylistic/space-before-blocks': 'error',
            '@stylistic/array-bracket-spacing': ['error', 'never'],
            '@stylistic/no-mixed-spaces-and-tabs': 'error',
            '@stylistic/no-tabs': 'error',
            '@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true }],
            '@stylistic/comma-spacing': ['error', {
                before: false,
                after: true,
            }],
            '@stylistic/template-curly-spacing': 'error',
            'id-denylist': ['error', 'err', 'e', 'evt', 's', 'cb'],
            'max-len': ['error', {
                code: 100,
                ignorePattern: maxLenIgnorePattern,
                ignoreTrailingComments: true,
                ignoreUrls: true,
                ignoreTemplateLiterals: true,
                ignoreRegExpLiterals: true,
                ignoreStrings: true,
            }],
            '@stylistic/no-multiple-empty-lines': ['error', {
                max: 2,
                maxBOF: 0,
                maxEOF: 0,
            }],
            '@stylistic/padding-line-between-statements': [
                'error',
                {
                    blankLine: 'always',
                    prev: '*',
                    next: 'return',
                },
                {
                    blankLine: 'always',
                    prev: '*',
                    next: 'throw',
                },
            ],
            '@stylistic/semi-spacing': ['error', {
                before: false,
                after: true,
            }],
            '@stylistic/array-bracket-newline': ['error', 'consistent'],
            '@stylistic/array-element-newline': ['error', 'consistent'],
            '@stylistic/object-curly-newline': ['error', {
                multiline: true,
                consistent: true,
            }],
            '@stylistic/object-property-newline': ['error', {
                allowAllPropertiesOnSameLine: true,
            }],
            'object-shorthand': ['error', 'properties'],
            '@stylistic/function-call-argument-newline': ['error', 'consistent'],
            '@stylistic/function-paren-newline': ['error', 'multiline-arguments'],
            'react/no-array-index-key': 'error',
            'react-hooks/exhaustive-deps': 'error',
            'react-hooks/rules-of-hooks': 'error',
            'react/no-danger-with-children': 'error',
            'react/jsx-closing-bracket-location': ['error', 'line-aligned'],
            'react/jsx-equals-spacing': ['error', 'never'],
            'react/jsx-fragments': ['error', 'syntax'],
            'react/jsx-handler-names': 'error',
            'react/jsx-max-props-per-line': ['error', {
                maximum: { single: 3, multi: 1 },
            }],
            'react/jsx-no-useless-fragment': ['error', {
                allowExpressions: true,
            }],
            'react/jsx-no-constructed-context-values': 'error',

            'react/jsx-one-expression-per-line': ['error', {
                allow: 'single-child',
            }],
            'react/jsx-props-no-multi-spaces': 'error',
            'react/jsx-tag-spacing': ['error', {
                beforeClosing: 'never',
            }],
            'react/jsx-wrap-multilines': ['error', {
                declaration: 'parens-new-line',
                assignment: 'parens-new-line',
                return: 'parens-new-line',
                arrow: 'parens-new-line',
                condition: 'parens-new-line',
                logical: 'parens-new-line',
                prop: 'parens-new-line',
            }],
            'import/newline-after-import': ['error', { count: 1 }],
            'perfectionist/sort-imports': [
                'error',
                {
                    newlinesBetween: 1,
                    type: 'alphabetical',
                    order: 'asc',
                    groups: [
                        'builtin',
                        'react',
                        'next',
                        'external',
                        'absolute',
                        'parent',
                        'sibling',
                        'index',
                        'unknown',
                        'svg',
                        'styles',
                    ],
                    customGroups: [
                        {
                            groupName: 'next',
                            elementNamePattern: '^next(/.*|$)',
                        },
                        {
                            groupName: 'absolute',
                            elementNamePattern: '^@/(.*|$)',
                        },
                        {
                            groupName: 'styles',
                            elementNamePattern: '.p?css$',
                        },
                        {
                            groupName: 'svg',
                            elementNamePattern: '.svg$',
                        },
                        {
                            groupName: 'react',
                            elementNamePattern: '^react',
                        },
                    ],
                },
            ],
            '@typescript-eslint/no-floating-promises': 'warn',
            '@typescript-eslint/restrict-template-expressions': ['error', {
                allowNumber: true,
                allowBoolean: true,
            }],
            '@typescript-eslint/no-misused-promises': ['error', {
                checksVoidReturn: false,
            }],
        },
    },
]);

export default eslintConfig;
