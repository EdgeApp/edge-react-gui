import * as React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import LinearGradient, { LinearGradientProps } from 'react-native-linear-gradient'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { useHandler } from '../../hooks/useHandler'
import { triggerHaptic } from '../../util/haptic'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SectionView } from './SectionView'

interface Props {
  // Top layer:
  overlay?: React.ReactNode // Rendered above/on top of children

  // children & icon share the same 2nd layer:
  children: React.ReactNode | React.ReactNode[]
  icon?: React.ReactNode

  // Everything else underneath, in order:
  gradientBackground?: LinearGradientProps // 3rd layer
  nodeBackground?: React.ReactNode // 4th layer, anything goes

  // DO NOT USE after a scene is fully UI4! Margins should all align without adjustment.
  marginRem?: number[] | number

  // Options:
  sections?: boolean // Automatic section dividers, only if chilren are multiple nodes
  onClose?: () => Promise<void> | void // If specified, adds a close button, absolutely positioned in the top right

  // Touchable area for the following span the entire card:
  onLongPress?: () => Promise<void> | void
  onPress?: () => Promise<void> | void
}

/**
 * Rounded card
 *
 * sections: Automatically adds horizontal dividers between each child, aligned
 * in a column layout. Adds no dividers if only one child is given.
 *
 * gradientBackground/nodeBackground: For specifying a complex background
 * that can include embedded images or any other component.
 *
 * onClose: If specified, adds a close button
 */
export const CardUi4 = (props: Props) => {
  const { children, icon, marginRem, overlay, sections, gradientBackground, nodeBackground, onClose, onLongPress, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const margin = sidesToMargin(mapSides(fixSides(marginRem, 0.5), theme.rem))
  const isPressable = onPress != null || onLongPress != null

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

  const background = (
    <View style={styles.backgroundFill}>
      {nodeBackground}
      {gradientBackground == null ? null : <LinearGradient {...gradientBackground} style={StyleSheet.absoluteFill} />}
    </View>
  )

  const maybeIcon = icon == null ? null : <View style={styles.iconContainer}>{icon}</View>

  const content = sections ? <SectionView>{children}</SectionView> : children

  const maybeCloseButton =
    onClose == null ? null : (
      <TouchableOpacity style={styles.cornerContainer} onPress={handleClose}>
        <AntDesignIcon color={theme.iconTappableAltUi4} name="close" size={theme.rem(1.25)} />
      </TouchableOpacity>
    )

  const maybeOverlay = overlay == null ? null : <View style={styles.overlayContainer}>{overlay}</View>

  const allContent =
    icon == null ? (
      <>
        {background}
        {content}
        {maybeCloseButton}
        {maybeOverlay}
      </>
    ) : (
      <>
        {background}
        <View style={styles.rowContainer}>
          {maybeIcon}
          {content}
        </View>
        {maybeCloseButton}
        {maybeOverlay}
      </>
    )

  return isPressable ? (
    <TouchableOpacity accessible={false} onPress={handlePress} onLongPress={handleLongPress} style={[styles.cardContainer, margin]}>
      {allContent}
    </TouchableOpacity>
  ) : (
    <View style={[styles.cardContainer, margin]}>{allContent}</View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  backgroundFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.rem(theme.cardRadiusRemUi4),
    backgroundColor: theme.cardBaseColorUi4,
    overflow: 'hidden'
  },
  cardContainer: {
    borderRadius: theme.rem(theme.cardRadiusRemUi4),
    padding: theme.rem(0.5),
    flex: 1
  },
  cornerContainer: {
    margin: theme.rem(1),
    top: 0,
    right: 0,
    position: 'absolute'
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: theme.cardOverlayDisabledUi4,
    borderRadius: theme.rem(theme.cardRadiusRemUi4),
    justifyContent: 'center',
    margin: 2,
    pointerEvents: 'none'
  },
  rowContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
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
