/**
 * `RuleTester` cases for this plugin's rules, run as a plain Node ESM
 * process.
 *
 * The rules are `.mjs` modules, which jest's react-native transform does not
 * load, so `src/__tests__/eslintRules.test.ts` spawns this file and asserts
 * it exits cleanly. Nothing else ran these rules against known-bad input:
 * `no-module-scope-lstrings` exists for the next edit, `npm run lint` never
 * fires it on today's tree, and a selector that stopped matching was
 * invisible to every gate.
 */
import tsParser from '@typescript-eslint/parser'
import { RuleTester } from 'eslint'

import noModuleScopeLstrings from './no-module-scope-lstrings.mjs'

const tester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: 'module'
  }
})

const IMPORT = "import { lstrings } from '../locales/strings'\n"
const error = { message: /Read lstrings inside a function/ }

tester.run('no-module-scope-lstrings', noModuleScopeLstrings, {
  valid: [
    // Read when called, which is after whichever boot the process runs.
    IMPORT + 'export function label(): string { return lstrings.ok }',
    IMPORT + 'export const label = (): string => lstrings.ok',
    IMPORT + 'export const all = () => Object.entries(lstrings)',
    // A deferred registration: the callback runs later.
    IMPORT + "register('x', () => lstrings.ok)",
    // A type position reads nothing at runtime.
    IMPORT +
      'type Strings = typeof lstrings\nexport const x: Strings | null = null',
    // Not the imported binding.
    'const lstrings = { ok: "ok" }\nexport const x = lstrings.ok'
  ],
  invalid: [
    { code: IMPORT + 'export const label = lstrings.ok', errors: [error] },
    { code: IMPORT + 'const { ok } = lstrings', errors: [error] },
    { code: IMPORT + 'const s = lstrings', errors: [error] },
    // The three shapes the selector-based version let through.
    { code: IMPORT + 'const all = Object.entries(lstrings)', errors: [error] },
    { code: IMPORT + 'const copy = { ...lstrings }', errors: [error] },
    {
      code: "import { lstrings as L } from '../locales/strings'\nconst ok = L.ok",
      errors: [error]
    },
    // An IIFE runs during module evaluation, so it is no function at all.
    {
      code: IMPORT + 'const ok = (() => lstrings.ok)()',
      errors: [error]
    }
  ]
})

console.log('eslint-plugin-edge rule tests: all passed')
