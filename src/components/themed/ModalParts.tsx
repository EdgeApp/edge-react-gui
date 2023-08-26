import * as React from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { cacheStyles } from 'react-native-patina'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { lstrings } from '../../locales/strings'
import { fixSides, mapSides, sidesToPadding } from '../../util/sides'
import { GradientFadeOut } from '../modals/GradientFadeout'
import { Theme, useTheme } from '../services/ThemeContext'
// TODO:
// KeyboardAwareScrollView (login) instead of ScrollView (here)

interface ModalTitleProps {
  children: React.ReactNode
  center?: boolean
  paddingRem?: number[] | number
  icon?: React.ReactNode
}

interface ModalFooterProps {
  onPress: () => void
}

export function ModalTitle(props: ModalTitleProps) {
  const { center, children, icon = null, paddingRem } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const padding = sidesToPadding(mapSides(fixSides(paddingRem, 0), theme.rem))

  return (
    <View style={styles.titleContainer}>
      {icon ? <View style={styles.titleIconContainer}>{icon}</View> : null}
      <Text style={[styles.titleText, center ? styles.titleCenter : null, padding]}>{children}</Text>
    </View>
  )
}

export function ModalMessage(props: { children: React.ReactNode; paddingRem?: number[] | number; isWarning?: boolean }) {
  const { children, isWarning, paddingRem } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const padding = sidesToPadding(mapSides(fixSides(paddingRem, 0), theme.rem))

  return <Text style={[styles.messageText, padding, isWarning && styles.warningText]}>{children}</Text>
}

/**
 * Renders a close button
 */
export function ModalFooter(props: ModalFooterProps) {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <TouchableOpacity onPress={props.onPress} style={styles.closeContainer}>
      <AntDesignIcon accessibilityHint={lstrings.modal_close_hint} color={theme.iconTappable} name="close" size={theme.rem(1.25)} />
    </TouchableOpacity>
  )
}

ModalFooter.bottomRem = 3

/**
 * A consistently styled scroll area for use in modals. Should only be used
 * within ThemedModal.
 */
export function ModalScrollArea(props: { children: React.ReactNode }) {
  const { children } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.scrollContainer}>
      <ScrollView contentContainerStyle={styles.scrollPadding}>{children}</ScrollView>
      <ModalFooterFade />
    </View>
  )
}

/**
 * For fading the bottom of the modal if the modal caller has its own special
 * scroll implementation and does not use the ThemedModal's built-in 'scroll'
 * prop
 */
export const ModalFooterFade = () => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={styles.footerFadeContainer}>
      <GradientFadeOut />
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  closeContainer: {
    alignItems: 'center',
    padding: theme.rem(1),
    marginBottom: theme.rem(-1)
  },
  scrollContainer: {
    marginBottom: theme.rem(-ModalFooter.bottomRem + 0.5)
  },
  scrollPadding: {
    paddingBottom: theme.rem(ModalFooter.bottomRem)
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    margin: theme.rem(0.5)
  },
  titleIconContainer: {
    marginRight: theme.rem(0.5)
  },
  titleText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1.2),
    marginVertical: theme.rem(0.5)
  },
  titleCenter: {
    textAlign: 'center'
  },
  warningText: {
    color: theme.warningText
  },
  messageText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    margin: theme.rem(0.5),
    textAlign: 'left'
  },
  footerFadeContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1
  }
}))
