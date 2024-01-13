import * as React from 'react'
import { getColors } from 'react-native-image-colors'

import { useState } from '../types/reactHooks'
import { EdgeAsset } from '../types/types'
import { getCurrencyIconUris } from '../util/CdnUris'

export const useIconColor = (edgeAsset: EdgeAsset): string | undefined => {
  const [color, setColor] = useState<string | undefined>(undefined)
  const primaryCurrencyIconUrl = React.useMemo(() => {
    const { pluginId, tokenId } = edgeAsset
    if (pluginId == null) return null

    // Get Currency Icon URI
    const icon = getCurrencyIconUris(pluginId, tokenId)
    return icon.symbolImage
  }, [edgeAsset])

  React.useEffect(() => {
    if (primaryCurrencyIconUrl == null) return

    getColors(primaryCurrencyIconUrl, {
      cache: true,
      key: primaryCurrencyIconUrl
    })
      .then(colors => {
        if (colors.platform === 'ios') {
          setColor(colors.primary)
        }
        if (colors.platform === 'android') {
          setColor(colors.vibrant)
        }
      })
      .catch(err => {
        console.warn(err)
      })
  }, [primaryCurrencyIconUrl])

  return color
}
