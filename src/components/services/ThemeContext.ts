import { cacheStyles, makeThemeContext } from 'react-native-patina'

import { config } from '../../theme/appConfig'
import { Theme } from '../../types/Theme'

export type { Theme }
export { cacheStyles }

/**
 * Utility for declaring `withTheme` components.
 */
export interface ThemeProps {
  theme: Theme
}

// Provide the theme context methods:
const themeContext = makeThemeContext(config.darkTheme)
export const { ThemeProvider, useTheme, withTheme, changeTheme, getTheme, watchTheme } = themeContext
