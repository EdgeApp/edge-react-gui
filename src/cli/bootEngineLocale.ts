/**
 * Side-effect locale boot for the engine.
 *
 * Detection happens in `bootNodeLocale`, which both entries import; applying
 * it — which pulls in `locales/strings` and every translation table — happens
 * only here, because only the engine builds localized prose.
 *
 * Must be the first import in `src/cli/engine/index.ts`.
 */
import { applyLocale } from '../locales/bootLocale'
import { getDetectedLocale } from './bootNodeLocale'

const applied = applyLocale(getDetectedLocale())

// Say so when the tag was accepted but no table exists for it. Discarding
// this made "the engine has your language" and "the engine is answering in
// English" indistinguishable, including from `engine-status`.
if (!applied.matched) {
  console.error(
    `[edge-engine] No translation table for locale ${applied.languageTag}; answering in English.`
  )
}
