import type {
  EdgeCorePluginOptions,
  EdgeCurrencyPlugin,
  EdgeOtherMethods
} from 'edge-core-js/types'

/**
 * Add this to your `nativeIo` object on React Native,
 * as `{ 'edge-currency-accountbased': makePluginIo() }`
 */
export function makePluginIo(): EdgeOtherMethods

/**
 * Debugging-URI to use on React Native,
 * along with running `yarn start` in this repo.
 */
export const debugUri: string

/* Regular URI to use on React Native. */
export const pluginUri: string

type EdgeCorePluginFactory = (env: EdgeCorePluginOptions) => EdgeCurrencyPlugin

/**
 * The Node.js default export.
 */
declare const plugins: {
  [pluginId: string]: EdgeCorePluginFactory
}

export default plugins
