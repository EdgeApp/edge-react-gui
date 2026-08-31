import { createIconSetFromFontello } from '@expo/vector-icons'

import fontelloConfig from './config.json'

// Edge's own Fontello set. The `custom.ttf` file ships in the app bundle on
// both platforms, so this renders against the natively-installed font rather
// than loading an asset through expo-font.
export const Fontello = createIconSetFromFontello(
  fontelloConfig,
  undefined,
  undefined
)
