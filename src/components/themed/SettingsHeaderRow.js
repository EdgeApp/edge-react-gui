// @flow

import * as React from 'react'
import { View } from 'react-native'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type OwnProps = {
  icon?: React.Node,
  numberOfLines?: number,
  text: string
}

type Props = OwnProps & ThemeProps

/**
 * A blue header row in a settings scene.
 */
export function SettingsHeaderRowComponent(props: Props): React.Node {
  const { icon, text, numberOfLines, theme } = props
  const styles = getStyles(theme)

  return (
    <View style={styles.row}>
      {icon != null ? <View style={styles.padding}>{icon}</View> : undefined}
      <EdgeText style={styles.text} numberOfLines={numberOfLines || 1}>
        {text}
      </EdgeText>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    // Layout:
    minHeight: theme.rem(2.75),
    padding: theme.rem(1),
    backgroundColor: theme.settingsRowHeaderBackground,

    // Children:
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },

  text: {
    flexShrink: 1,
    flexGrow: 1,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1),
    textAlign: 'left',
    color: theme.primaryText
  },

  padding: {
    paddingRight: theme.rem(0.75)
  }
}))

export const SettingsHeaderRow: React.StatelessFunctionalComponent<$Exact<OwnProps>> = withTheme(SettingsHeaderRowComponent)
