import * as React from 'react'
import { StyleSheet, View } from 'react-native'

import { memo } from '../../types/reactHooks'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { DividerLine } from './DividerLine'
import { EdgeText } from './EdgeText'

type Props = {
  title?: string
  children?: React.ReactNode
  underline?: boolean
  withTopMargin?: boolean
  // @ts-expect-error
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
