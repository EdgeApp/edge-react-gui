import { createIconSetFromFontello } from '@expo/vector-icons'

import fontelloConfig from './config.json'

// Custom Fontello set via @expo/vector-icons (web-ready). Native still uses
// the RNVI font already linked for login-ui.

export const Fontello = createIconSetFromFontello(
  fontelloConfig,
  undefined,
  undefined
)
