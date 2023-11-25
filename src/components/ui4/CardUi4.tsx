import * as React from 'react'
import { StyleSheet, TouchableHighlight, View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { triggerHaptic } from '../../util/haptic'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SectionView } from './SectionView'

export type CardType = 'default' | 'warning' | 'error'

interface Props {
  children: React.ReactNode | React.ReactNode[]
  icon?: React.ReactNode
  overlay?: React.ReactNode
  onLongPress?: () => Promise<void> | void
  onPress?: () => Promise<void> | void
  // cardType?: CardType // TODO
}

/**
 * Rounded card that automatically adds horizontal dividers between each child,
 * aligned in a column layout. Adds no dividers if only one child is given.
 */
export const CardUi4 = (props: Props) => {
  const { children, icon, overlay, onLongPress, onPress } = props
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
        {icon == null ? null : <View style={styles.iconContainer}>{icon}</View>}
        <SectionView>{children}</SectionView>
        {overlay == null ? null : <View style={styles.overlayContainer}>{overlay}</View>}
      </>
    </TouchableHighlight>
  )
}

// TODO: Adjust margin/padding so everything combines with correct layout no
// matter the combination of UI4 components.
const getStyles = cacheStyles((theme: Theme) => ({
  cardContainer: {
    backgroundColor: theme.cardBackgroundUi4,
    borderRadius: theme.rem(theme.cardRadiusRemUi4),
    margin: theme.rem(0.5),
    padding: theme.rem(0.5),
    flexDirection: 'row'
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
