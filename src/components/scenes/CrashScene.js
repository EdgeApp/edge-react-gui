// @flow

import * as React from 'react'
import { Text } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import s from '../../locales/strings.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

/**
 * This component will be displayed when an error boundary catches an error
 */
function CrashSceneComponent(props: ThemeProps): React.Node {
  const { theme } = props
  const styles = getStyles(theme)

  return (
    <SceneWrapper background="theme" padding={theme.rem(0.5)}>
      <AntDesignIcon name="frowno" style={styles.icon} />
      <Text style={styles.titleText}>{s.strings.error_boundary_title}</Text>
      <Text style={styles.messageText}>{s.strings.error_boundary_message}</Text>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  icon: {
    alignSelf: 'center',
    color: theme.primaryText,
    fontSize: theme.rem(2),
    margin: theme.rem(0.5)
  },
  titleText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1.25),
    margin: theme.rem(0.5),
    textAlign: 'center'
  },
  messageText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    margin: theme.rem(0.5),
    textAlign: 'left'
  }
}))

export const CrashScene = withTheme(CrashSceneComponent)
