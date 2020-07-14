// @flow

import React, { type Node } from 'react'
import { Text, TouchableHighlight, View } from 'react-native'

import { dayText } from '../../styles/common/textStyles.js'
import { type ThemeProps, cacheStyles, withTheme } from '../../theme/ThemeContext.js'

type OwnProps = {
  disabled?: boolean, // Show with grey style
  icon?: Node,
  text: string | Node,
  right?: Node,
  onPress?: () => void,
  marginBottom?: boolean
}

type Props = OwnProps & ThemeProps

/**
 * A settings row features tappable text, as well as an optional icon
 * on the left and another optional component on the right.
 */
function SettingsRowComponent(props: Props): Node {
  const { disabled = false, icon, marginBottom = true, text, theme, right, onPress } = props
  const styles = getStyles(theme)
  const rowMarginBottom = marginBottom ? styles.marginBottom : null

  return (
    <TouchableHighlight onPress={onPress} underlayColor={theme.transparent}>
      <View style={[styles.row, rowMarginBottom]}>
        {icon != null ? <View style={styles.paddingLeftIcon}>{icon}</View> : undefined}
        <Text style={disabled ? styles.disabledText : styles.text}>{text}</Text>
        {right != null ? <View style={styles.paddingRightIcon}>{right}</View> : undefined}
      </View>
    </TouchableHighlight>
  )
}

const getStyles = cacheStyles(theme => ({
  row: {
    // Appearance:
    backgroundColor: theme.settingsRowBackground,

    // Layout:
    minHeight: theme.rem(2.75),
    padding: theme.rem(0.75),

    // Children:
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  marginBottom: {
    marginBottom: theme.rem(1 / 16)
  },
  text: {
    ...dayText('row-left'),
    color: theme.primaryText,
    flexGrow: 1
  },
  disabledText: {
    ...dayText('row-left'),
    color: theme.disabledText,
    flexGrow: 1
  },
  paddingLeftIcon: {
    paddingRight: theme.rem(0.75)
  },
  paddingRightIcon: {
    paddingLeft: theme.rem(0.75)
  }
}))

export const SettingsRow = withTheme(SettingsRowComponent)
