// @flow

import { cacheStyles, makeThemeContext } from 'react-native-patina'

import { womanTheme } from '../../theme/variables/womanTheme'
import { type Theme } from '../../types/Theme.js'

export type { Theme }
export { cacheStyles }

/**
 * Utility type for declaring `withTheme` components.
 */
export type ThemeProps = {
  theme: Theme
}

// Provide the theme context methods:
const themeContext = makeThemeContext(womanTheme)
export const { ThemeProvider, useTheme, withTheme, changeTheme, getTheme, watchTheme } = themeContext
