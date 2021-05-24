// @flow

import * as React from 'react'
import { Dimensions, View } from 'react-native'

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

  return (
    <View style={[styles.container, props.style]}>
      {underline ? <View style={styles.underline} /> : null}
      {children}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    position: 'relative',
    paddingTop: 1,
    paddingLeft: theme.rem(1),
    paddingRight: theme.rem(1)
  },
  underline: {
    borderTopWidth: theme.thinLineWidth,
    borderTopColor: theme.lineDivider,
    width: Dimensions.get('window').width - theme.rem(1),
    alignSelf: 'stretch',
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 100,
    marginLeft: theme.rem(1)
  },
  topMargin: {
    marginTop: theme.rem(1)
  }
}))

export default SceneFooter
