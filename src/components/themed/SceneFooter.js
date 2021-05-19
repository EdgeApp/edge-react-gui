// @flow

import * as React from 'react'
import { View } from 'react-native'

import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

type Props = {
  children?: React.Node,
  underline?: boolean,
  style?: any
}

function SceneFooter(props: Props) {
  const { underline, children } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return <View style={[styles.container, props.style, underline ? styles.underline : null]}>{children}</View>
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    paddingLeft: theme.rem(1),
    paddingRight: theme.rem(1)
  },
  underline: {
    borderTopWidth: theme.thinLineWidth,
    borderTopColor: theme.lineDivider
  },
  topMargin: {
    marginTop: theme.rem(1)
  }
}))

export default SceneFooter
