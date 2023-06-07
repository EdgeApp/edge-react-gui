import * as React from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { cacheStyles } from 'react-native-patina'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { lstrings } from '../../locales/strings'
import { fixSides, mapSides, sidesToPadding } from '../../util/sides'
import { GradientFadeOut } from '../modals/GradientFadeout'
import { Theme, useTheme } from '../services/ThemeContext'

interface ModalTitleProps {
  children: React.ReactNode
  center?: boolean
  paddingRem?: number[] | number
  icon?: React.ReactNode
}

interface ModalFooterProps {
  onPress: () => void
  fadeOut?: boolean | undefined
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
 * Renders a close button and an optional fade-out gradient.
 *
 * If you use the fade-out gradient, your scroll element's
 * `contentContainerStyle` needs `theme.rem(ModalFooter.bottomRem)`
 * worth of bottom padding, so the close button does not cover your content.
 */
export function ModalFooter(props: ModalFooterProps) {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { fadeOut } = props

  const footerFadeContainer = fadeOut === true ? styles.footerFadeContainer : undefined
  const footerFade = fadeOut === true ? styles.footerFade : undefined

  return (
    <View style={footerFadeContainer}>
      <View style={footerFade}>
        <TouchableOpacity onPress={props.onPress} style={styles.closeIcon}>
          <AntDesignIcon accessibilityHint={lstrings.modal_close_hint} color={theme.iconTappable} name="close" size={theme.rem(1.25)} />
        </TouchableOpacity>
      </View>
      {fadeOut !== true ? null : <GradientFadeOut />}
    </View>
  )
}

ModalFooter.bottomRem = 2.5

export function ModalScrollArea(props: { children: React.ReactNode; onCancel: () => void }) {
  const { children, onCancel } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View>
      <ScrollView contentContainerStyle={styles.scrollPadding}>{children}</ScrollView>
      <ModalFooter onPress={onCancel} fadeOut />
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  closeIcon: {
    alignItems: 'center',
    padding: theme.rem(1)
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
    marginBottom: theme.rem(-1)
  },
  footerFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1
  }
}))
