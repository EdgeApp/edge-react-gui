import * as React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { cacheStyles } from 'react-native-patina'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { fixSides, mapSides, sidesToPadding } from '../../util/sides'
import { Theme, useTheme } from '../services/ThemeContext'

interface ModalTitleProps {
  children: React.ReactNode
  center?: boolean
  paddingRem?: number[] | number
  icon?: React.ReactNode
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

export function ModalCloseArrow(props: { onPress: () => void }) {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <TouchableOpacity onPress={props.onPress} style={styles.closeArrow}>
      <AntDesignIcon name="close" size={theme.rem(1.25)} color={theme.iconTappable} />
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  closeArrow: {
    alignItems: 'center',
    paddingTop: theme.rem(1)
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
  }
}))
