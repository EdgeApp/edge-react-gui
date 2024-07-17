import * as React from 'react'
import { ScrollView, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { openBrowserUri } from '../../util/WebUtils'
import { ButtonsView } from '../buttons/ButtonsView'
import { DotsBackground } from '../common/DotsBackground'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props {}

/**
 * This component will be displayed when an error boundary catches an error
 */
export function CrashScene(props: Props): React.ReactElement {
  const theme = useTheme()
  const styles = getStyles(theme)

  const safeAreaInsets = useSafeAreaInsets()

  return (
    <>
      <DotsBackground />
      <ScrollView style={[styles.container, safeAreaInsets]}>
        <AntDesignIcon name="frowno" style={styles.icon} />
        <Text style={styles.titleText}>{lstrings.error_boundary_title}</Text>
        <Text style={styles.messageText}>{sprintf(lstrings.error_boundary_message_s, config.appNameShort)}</Text>
        <ButtonsView secondary={{ label: lstrings.error_boundary_help_button, onPress: () => openBrowserUri(config.forceCloseUrl) }} />
        <Text style={styles.messageText}>{lstrings.error_boundary_message2}</Text>
        <ButtonsView secondary={{ label: lstrings.button_support, onPress: () => openBrowserUri(config.supportContactSite) }} />
      </ScrollView>
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    position: 'absolute'
  },
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
