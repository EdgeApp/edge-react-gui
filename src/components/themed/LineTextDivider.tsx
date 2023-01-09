import * as React from 'react'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'

import { fadeInLeftAnimation, LAYOUT_ANIMATION } from '../../constants/animationConstants'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

interface Props {
  title?: string
  children?: React.ReactNode
  lowerCased?: boolean
}

export const LineTextDividerComponent = (props: Props) => {
  const { title, children, lowerCased } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <Animated.View style={styles.container} layout={LAYOUT_ANIMATION} entering={fadeInLeftAnimation()}>
      <View style={styles.line} />
      {title ? <EdgeText style={[styles.title, lowerCased ? styles.lowerCase : null]}>{title}</EdgeText> : null}
      {children}
      <View style={styles.line} />
    </Animated.View>
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

export const LineTextDivider = React.memo(LineTextDividerComponent)
