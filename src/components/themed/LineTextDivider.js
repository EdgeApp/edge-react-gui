// @flow

import * as React from 'react'
import { View } from 'react-native'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type Props = {
  title?: string,
  children?: React.Node,
  lowerCased?: boolean
}

class LineTextDividerComponent extends React.PureComponent<Props & ThemeProps> {
  render() {
    const { title, children, theme } = this.props
    const styles = getStyles(theme)
    return (
      <View style={styles.container}>
        <View style={styles.line} />
        {title ? <EdgeText style={[styles.title, this.props.lowerCased ? styles.lowerCase : null]}>{title}</EdgeText> : null}
        {children}
        <View style={styles.line} />
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    width: '100%',
    paddingHorizontal: theme.rem(1),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: theme.rem(1)
  },
  line: {
    flex: 1,
    borderBottomWidth: theme.thinLineWidth,
    borderBottomColor: theme.titleLineDivider
  },
  title: {
    fontSize: theme.rem(1),
    paddingHorizontal: theme.rem(0.75),
    fontFamily: theme.fontFaceBold,
    color: theme.secondaryText
  },
  lowerCase: {
    textTransform: 'lowercase'
  }
}))

export const LineTextDivider = withTheme(LineTextDividerComponent)
