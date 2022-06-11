// @flow

import * as React from 'react'
import { View } from 'react-native'

import { memo } from '../../types/reactHooks.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type Props = {
  title?: string,
  children?: React.Node,
  lowerCased?: boolean
}

export const LineTextDividerComponent = (props: Props) => {
  const { title, children, lowerCased } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      {title ? <EdgeText style={[styles.title, lowerCased ? styles.lowerCase : null]}>{title}</EdgeText> : null}
      {children}
      <View style={styles.line} />
    </View>
  )
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
    fontFamily: theme.fontFaceMedium,
    color: theme.secondaryText
  },
  lowerCase: {
    textTransform: 'lowercase'
  }
}))

export const LineTextDivider = memo(LineTextDividerComponent)
