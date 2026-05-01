import * as React from 'react'
import FastImage, { type ImageStyle } from 'react-native-fast-image'

import ENS_LOGO from '../../assets/images/ens_logo.png'
import type { NameService } from '../../util/nameServices'
import { useTheme } from '../services/ThemeContext'

// Map of name-service identifier to its logo asset. Services without a bundled
// asset render no prefix at all (no placeholder, no reserved space) so the
// caller's text appears unchanged.
const LOGO_MAP: Record<NameService, number | null> = {
  ens: ENS_LOGO,
  unstoppable: null,
  zns: null
}

interface Props {
  service: NameService
  // Edge-to-edge size of the logo. Defaults to `theme.rem(1)` so the prefix
  // matches surrounding default-sized text. Override for contexts using a
  // larger or smaller text size.
  size?: number
}

// Small inline logo to prefix a resolved name string (e.g. "[ENS] alice.eth").
// Caller is responsible for the row layout — wrap this and the text in a
// `flexDirection: 'row'` view, or use it inside a `<Text>` block on platforms
// that support inline images in text.
export const NameServicePrefix: React.FC<Props> = ({ service, size }) => {
  const theme = useTheme()
  const source = LOGO_MAP[service]
  if (source == null) return null
  const dim = size ?? theme.rem(1)
  const style: ImageStyle = {
    width: dim,
    height: dim,
    marginRight: theme.rem(0.25)
  }
  return (
    <FastImage
      source={source}
      style={style}
      resizeMode={FastImage.resizeMode.contain}
    />
  )
}
