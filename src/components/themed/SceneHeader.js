// @flow

import * as React from 'react'
import { StyleSheet, View } from 'react-native'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type Props = {
  title?: string,
  children?: React.Node,
  underline?: boolean,
  withTopMargin?: boolean,
  style?: StyleSheet.Styles
}

export class SceneHeaderComponent extends React.PureComponent<Props & ThemeProps> {
  render() {
    const { title, underline, withTopMargin, children, theme, style } = this.props
    const styles = getStyles(theme)
    return (
      <View style={[styles.container, withTopMargin ? styles.topMargin : null, underline ? styles.underline : null, style]}>
        {title ? <EdgeText style={styles.title}>{title}</EdgeText> : null}
        {children}
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    justifyContent: 'center',
    marginLeft: theme.rem(1),
    marginBottom: theme.rem(0.5),
    paddingBottom: theme.rem(1)
  },
  underline: {
    borderBottomWidth: theme.thinLineWidth,
    borderBottomColor: theme.lineDivider
  },
  topMargin: {
    marginTop: theme.rem(1)
  },
  title: {
    fontSize: theme.rem(1.2),
    fontFamily: theme.fontFaceMedium
  }
}))

export const SceneHeader = withTheme(SceneHeaderComponent)
