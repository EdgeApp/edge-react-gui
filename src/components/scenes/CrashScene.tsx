import * as React from 'react'
import { Text } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { SceneWrapper } from '../common/SceneWrapper'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'

/**
 * This component will be displayed when an error boundary catches an error
 */
function CrashSceneComponent(props: ThemeProps): React.ReactNode {
  const { theme } = props
  const styles = getStyles(theme)

  return (
    <SceneWrapper background="theme" padding={theme.rem(0.5)} scroll>
      <AntDesignIcon name="frowno" style={styles.icon} />
      <Text style={styles.titleText}>{s.strings.error_boundary_title}</Text>
      <Text style={styles.messageText}>{sprintf(s.strings.error_boundary_message_s, config.supportEmail)}</Text>
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

// @ts-expect-error
export const CrashScene = withTheme(CrashSceneComponent)
