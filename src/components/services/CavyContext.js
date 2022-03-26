// @flow
import { cacheStyles, makeThemeContext } from 'react-native-patina'

import { type Theme } from '../../types/Theme.js'

export type { Theme }
export { cacheStyles }

/**
 * Utility type for declaring `withTheme` components.
 */
export type ThemeProps = {
  theme: Theme
}
