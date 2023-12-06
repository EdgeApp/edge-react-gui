import * as React from 'react'
import { StyleSheet, TouchableHighlight, TouchableOpacity, View } from 'react-native'
import LinearGradient, { LinearGradientProps } from 'react-native-linear-gradient'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { useHandler } from '../../hooks/useHandler'
import { triggerHaptic } from '../../util/haptic'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SectionView } from './SectionView'

export type CardType = 'default' | 'warning' | 'error'

interface Props {
  children: React.ReactNode | React.ReactNode[] // Top layer

  icon?: React.ReactNode
  overlay?: React.ReactNode

  // These two override the default theme background:
  underlayForeground?: React.ReactNode // Middle layer, e.g. embedded images as part of the background
  underlayBackground?: LinearGradientProps // Bottom layer gradient

  onClose?: () => Promise<void> | void
  onLongPress?: () => Promise<void> | void
  onPress?: () => Promise<void> | void
  // cardType?: CardType // TODO
}

/**
 * Rounded card that automatically adds horizontal dividers between each child,
 * aligned in a column layout. Adds no dividers if only one child is given.
 *
 * The background is divided into two 'underlay' props.
 * If unspecified, defaults to the theme-defined background.
 */
export const CardUi4 = (props: Props) => {
  const { children, icon, overlay, underlayForeground, underlayBackground, onClose, onLongPress, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const handlePress = useHandler(async () => {
    if (onPress != null) {
      triggerHaptic('impactLight')
      try {
        await onPress()
      } catch (err) {
        showError(err)
      }
    }
  })

  const handleLongPress = useHandler(async () => {
    if (onLongPress != null) {
      triggerHaptic('impactLight')
      try {
        await onLongPress()
      } catch (err) {
        showError(err)
      }
    }
  })

  const handleClose = useHandler(() => {
    triggerHaptic('impactLight')
  })

  return (
    <TouchableHighlight
      accessible={false}
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={handlePress == null && handleLongPress == null}
      underlayColor={theme.touchHighlightUi4}
      style={styles.cardContainer}
    >
      <>
        <LinearGradient {...theme.cardBackgroundUi4} {...underlayBackground} style={[StyleSheet.absoluteFill, styles.backgroundFill]}>
          {underlayForeground}
        </LinearGradient>
        {icon == null ? null : <View style={styles.iconContainer}>{icon}</View>}
        <SectionView>{children}</SectionView>
        {onClose == null ? null : (
          <TouchableOpacity style={styles.cornerContainer} onPress={handleClose}>
            <AntDesignIcon color={theme.iconTappableAltUi4} name="close" size={theme.rem(1.25)} />
          </TouchableOpacity>
        )}
        {overlay == null ? null : <View style={styles.overlayContainer}>{overlay}</View>}
      </>
    </TouchableHighlight>
  )
}

// TODO: Adjust margin/padding so everything combines with correct layout no
// matter the combination of UI4 components.
const getStyles = cacheStyles((theme: Theme) => ({
  backgroundFill: {
    borderRadius: theme.rem(theme.cardRadiusRemUi4)
  },
  cardContainer: {
    borderRadius: theme.rem(theme.cardRadiusRemUi4),
    margin: theme.rem(0.5),
    padding: theme.rem(0.5),
    flexDirection: 'row'
  },
  cornerContainer: {
    margin: theme.rem(0.25),
    justifyContent: 'flex-start',
    alignContent: 'center'
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: theme.cardDisabledOverlayUi4,
    borderRadius: theme.rem(theme.cardRadiusRemUi4),
    justifyContent: 'center',
    margin: 2,
    pointerEvents: 'none'
  },
  iconContainer: {
    margin: theme.rem(0.25),
    justifyContent: 'center',
    alignContent: 'center'
  },
  warning: {
    borderColor: theme.warningIcon
  }
}))
