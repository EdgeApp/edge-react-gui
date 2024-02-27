import * as React from 'react'
import { Platform, Text } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { openBrowserUri } from '../../util/WebUtils'
import { SceneWrapper } from '../common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { ButtonsViewUi4 } from '../ui4/ButtonsViewUi4'

interface Props {}

/**
 * This component will be displayed when an error boundary catches an error
 */
export function CrashScene(props: Props): React.ReactElement {
  const theme = useTheme()
  const styles = getStyles(theme)

  const url = Platform.OS === 'ios' ? config.forceCloseUrlIos : config.forceCloseUrlAndroid

  return (
    <SceneWrapper padding={theme.rem(0.5)} scroll>
      <AntDesignIcon name="frowno" style={styles.icon} />
      <Text style={styles.titleText}>{lstrings.error_boundary_title}</Text>
      <Text style={styles.messageText}>{sprintf(lstrings.error_boundary_message_s, config.appNameShort)}</Text>
      <ButtonsViewUi4 secondary={{ label: lstrings.error_boundary_help_button, onPress: () => openBrowserUri(url) }} />
      <Text style={styles.messageText}>{lstrings.error_boundary_message2}</Text>
      <ButtonsViewUi4 secondary={{ label: lstrings.button_support, onPress: () => openBrowserUri(config.supportContactSite) }} />
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
