// @flow

import * as React from 'react'
import { StyleSheet, View } from 'react-native'

import { memo } from '../../types/reactHooks.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { DividerLine } from './DividerLine.js'
import { EdgeText } from './EdgeText.js'

type Props = {
  title?: string,
  children?: React.Node,
  underline?: boolean,
  withTopMargin?: boolean,
  style?: StyleSheet.Styles
}

export const SceneHeaderComponent = (props: Props) => {
  const { title, underline, withTopMargin, children, style } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <>
      <View style={[styles.container, withTopMargin ? styles.topMargin : null, style]}>
        {title ? <EdgeText style={styles.title}>{title}</EdgeText> : null}
        {children}
      </View>
      <View style={styles.dividerLine}>{underline ? <DividerLine /> : null}</View>
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    justifyContent: 'center',
    marginLeft: theme.rem(1),
    paddingBottom: theme.rem(1)
  },
  topMargin: {
    marginTop: theme.rem(1)
  },
  dividerLine: {
    marginLeft: theme.rem(1),
    marginBottom: theme.rem(0.5)
  },
  title: {
    fontSize: theme.rem(1.2),
    fontFamily: theme.fontFaceMedium
  }
}))

export const SceneHeader = memo(SceneHeaderComponent)
