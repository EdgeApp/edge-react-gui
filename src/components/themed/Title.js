// @flow

import * as React from 'react'
import { View } from 'react-native'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type OwnProps = {
  icon?: React.Node,
  text: string
}

type Props = OwnProps & ThemeProps

export function TitleComponent(props: Props): React.Node {
  const { icon, text, theme } = props
  const styles = getStyles(theme)

  return (
    <View style={styles.row}>
      {icon ? <View style={styles.padding}>{icon}</View> : null}
      <EdgeText style={styles.text}>{text}</EdgeText>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    // Layout:
    minHeight: theme.rem(1.75),
    marginBottom: theme.rem(0.7),

    // Children:
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },

  text: {
    flexShrink: 1,
    flexGrow: 1,
    fontFamily: theme.fontFaceBold,
    fontSize: theme.rem(1),
    textAlign: 'left',
    color: theme.primaryText
  },

  padding: {
    paddingRight: theme.rem(0.75)
  }
}))

export const Title = withTheme(TitleComponent)
