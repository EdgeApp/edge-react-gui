import * as React from 'react'
import { View, ViewStyle } from 'react-native'

import { DividerLine } from '../common/DividerLine'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

interface Props {
  children?: React.ReactNode
  style?: ViewStyle

  tertiary?: React.ReactNode
  title?: string
  underline?: boolean
  withTopMargin?: boolean
}

const SceneHeaderComponent = (props: Props) => {
  const { children, style, tertiary = null, title, underline = false, withTopMargin = false } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <>
      <View style={[styles.container, withTopMargin ? styles.topMargin : null, style]}>
        <View style={styles.titleContainer}>
          {title == null ? null : <EdgeText style={styles.title}>{title}</EdgeText>}
          {tertiary}
        </View>
        {children}
      </View>
      {underline ? <DividerLine extendRight /> : null}
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    justifyContent: 'center',
    marginHorizontal: theme.rem(1),
    paddingBottom: theme.rem(0.5)
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  topMargin: {
    marginTop: theme.rem(1)
  },
  title: {
    fontSize: theme.rem(1.2),
    fontFamily: theme.fontFaceMedium
  }
}))

/** @deprecated - Use SceneHeaderUi4 instead */
export const SceneHeader = React.memo(SceneHeaderComponent)
