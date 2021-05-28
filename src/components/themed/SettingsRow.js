// @flow

import * as React from 'react'
import { Text, TouchableHighlight, View } from 'react-native'

import {
  type Theme,
  type ThemeProps,
  cacheStyles,
  withTheme
} from '../services/ThemeContext.js'

type OwnProps = {
  bottomGap?: boolean,
  disabled?: boolean, // Show with grey style
  icon?: React.Node,
  text: string | React.Node,
  right?: React.Node,
  onPress?: () => void
}

type Props = OwnProps & ThemeProps

/**
 * A settings row features tappable text, as well as an optional icon
 * on the left and another optional component on the right.
 */
function SettingsRowComponent(props: Props): React.Node {
  const {
    bottomGap = true,
    disabled = false,
    icon,
    text,
    theme,
    right,
    onPress
  } = props
  const styles = getStyles(theme)

  return (
    <TouchableHighlight
      onPress={onPress}
      underlayColor={theme.settingsRowPressed}
    >
      <View style={bottomGap ? [styles.row, styles.bottomGap] : styles.row}>
        {icon != null ? (
          <View style={styles.paddingLeftIcon}>{icon}</View>
        ) : undefined}
        <Text style={disabled ? styles.disabledText : styles.text}>{text}</Text>
        {right != null ? (
          <View style={styles.paddingRightIcon}>{right}</View>
        ) : undefined}
      </View>
    </TouchableHighlight>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    // Appearance:
    backgroundColor: theme.settingsRowBackground,

    // Layout:
    minHeight: theme.rem(2.75),
    padding: theme.rem(1),

    // Children:
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  bottomGap: {
    marginBottom: theme.rem(1 / 16)
  },
  text: {
    color: theme.primaryText,
    flexGrow: 1,
    flexShrink: 1,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    textAlign: 'left'
  },
  disabledText: {
    color: theme.deactivatedText,
    flexGrow: 1,
    flexShrink: 1,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    textAlign: 'left'
  },
  paddingLeftIcon: {
    paddingRight: theme.rem(0.75)
  },
  paddingRightIcon: {
    paddingLeft: theme.rem(0.75)
  }
}))

export const SettingsRow = withTheme(SettingsRowComponent)
