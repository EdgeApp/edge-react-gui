import type { EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { StyleSheet } from 'react-native'
import FastImage from 'react-native-fast-image'
import { ShadowedView } from 'react-native-fast-shadow'

import customAssetIcon from '../../assets/images/custom-asset.png'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useSelector } from '../../types/reactRedux'
import { getCurrencyIconUris } from '../../util/CdnUris'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { UnscaledText } from '../text/UnscaledText'

export interface CryptoIconProps {
  // Main props - If non is specified, would just render an empty view
  pluginId: string
  tokenId: EdgeTokenId // Needed when it's a token (not the plugin's native currency)

  // Image props
  hideSecondary?: boolean // Only show the currency icon for token (no secondary icon for the network)
  mono?: boolean // To use the mono dark icon logo
  secondaryIconOverride?: number | { uri: string }

  // Styling props
  marginRem?: number | number[]
  sizeRem?: number

  // Optional overlay rendered above the icon (e.g., sync ring)
  children?: React.ReactNode
}

export const CryptoIcon: React.FC<CryptoIconProps> = (
  props: CryptoIconProps
) => {
  const {
    hideSecondary = false,
    marginRem,
    mono = false,
    secondaryIconOverride,
    sizeRem = 2,
    tokenId,
    children
  } = props

  const theme = useTheme()
  const styles = getStyles(theme)
  const size = theme.rem(sizeRem)
  const [loadError, setLoadError] = React.useState(false)
  const [secondaryLoadError, setSecondaryLoadError] = React.useState(false)

  const { pluginId } = props
  const useChainIcon = SPECIAL_CURRENCY_INFO[pluginId]?.showChainIcon ?? false

  // Primary Currency icon
  const icon = getCurrencyIconUris(pluginId, tokenId, useChainIcon)
  const primaryCurrencyIconUrl = mono
    ? icon.symbolImageDarkMono
    : icon.symbolImage
  const primaryCurrencyIcon = { uri: primaryCurrencyIconUrl }

  // Reset primary load error when the icon URL changes
  React.useEffect(() => {
    setLoadError(false)
  }, [primaryCurrencyIconUrl])

  // Secondary (parent) currency icon (if it's a token)
  let secondaryCurrencyIcon = secondaryIconOverride
  if (secondaryIconOverride == null && (tokenId != null || useChainIcon)) {
    const icon = getCurrencyIconUris(pluginId, null)
    secondaryCurrencyIcon = {
      uri: mono ? icon.symbolImageDarkMono : icon.symbolImage
    }
  }

  const shadowStyle = React.useMemo(
    () => ({
      height: size,
      width: size,
      borderRadius: size / 2,
      backgroundColor: theme.iconShadow.shadowColor,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      ...theme.iconShadow,
      ...sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem))
    }),
    [size, theme, marginRem]
  )

  // Custom/fallback icon styles
  const fallbackIconStyle = React.useMemo(
    () => ({ width: size, height: size }),
    [size]
  )

  const derivedCustomCurrencyCode = useSelector(state => {
    try {
      const config = state.core.account.currencyConfig[pluginId]
      if (config == null) return undefined
      if (tokenId == null) return config.currencyInfo.currencyCode
      return config.allTokens[tokenId]?.currencyCode
    } catch {
      return undefined
    }
  })

  const fallbackTextOverlayStyle = React.useMemo(
    () => [
      styles.fallbackText,
      { lineHeight: size, fontSize: theme.rem(sizeRem * 0.3) }
    ],
    [size, sizeRem, styles.fallbackText, theme]
  )

  // Handlers
  const handlePrimaryError = useHandler(() => {
    setLoadError(true)
  })

  const handleSecondaryError = useHandler(() => {
    setSecondaryLoadError(true)
  })

  const showSecondary =
    !hideSecondary && secondaryCurrencyIcon != null && !secondaryLoadError

  return (
    <ShadowedView style={shadowStyle}>
      {loadError ? (
        <>
          <FastImage
            style={fallbackIconStyle}
            source={customAssetIcon}
            resizeMode="contain"
          />
          {derivedCustomCurrencyCode == null ? null : (
            <UnscaledText
              numberOfLines={1}
              adjustsFontSizeToFit
              style={fallbackTextOverlayStyle}
            >
              {derivedCustomCurrencyCode.slice(0, 3).toUpperCase()}
            </UnscaledText>
          )}
        </>
      ) : (
        <FastImage
          style={StyleSheet.absoluteFill}
          source={primaryCurrencyIcon}
          onError={handlePrimaryError}
        />
      )}
      {showSecondary ? (
        <FastImage
          style={styles.parentIcon}
          source={secondaryCurrencyIcon}
          onError={handleSecondaryError}
        />
      ) : null}
      {children}
    </ShadowedView>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  parentIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '50%',
    height: '50%'
  },
  fallbackText: {
    color: theme.assetFallbackText,
    textAlign: 'center',
    alignSelf: 'center',
    position: 'absolute',
    ...theme.cardTextShadow,
    // Slightly skewed towards the top right, to account for the optical
    // illusion resulting from the darker left gradient of the icon. Basically
    // this makes it look "truly" centered.
    top: -theme.rem(0.05),
    paddingRight: theme.rem(0.15),
    paddingLeft: theme.rem(0.3)
  }
}))
