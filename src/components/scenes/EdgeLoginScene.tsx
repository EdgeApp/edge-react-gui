import { EdgeLobby } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Image, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { WarningCard } from '../cards/WarningCard'
import { CrossFade } from '../common/CrossFade'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { TitleText } from '../text/TitleText'
import { Fade } from '../themed/Fade'
import { MainButton } from '../themed/MainButton'

interface Props extends EdgeSceneProps<'edgeLogin'> {}

export const EdgeLoginScene = (props: Props) => {
  const { navigation, route } = props
  const { lobbyId } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const [lobby, setLobby] = React.useState<EdgeLobby | undefined>(undefined)

  const warningMessage =
    lobby?.loginRequest?.appId === ''
      ? sprintf(lstrings.edge_description_warning, lobby?.loginRequest?.displayName)
      : sprintf(lstrings.access_wallet_description, config.appName)

  useAsyncEffect(async () => {
    try {
      setLobby(await account.fetchLobby(lobbyId))
    } catch (error: any) {
      if (error.message.includes('Account does not')) {
        await showOkModal(lstrings.edge_login_failed, lstrings.edge_login_fail_stale_qr)
      } else {
        showError(error)
      }
      navigation.pop()
    }
  }, [lobbyId])

  const handleAccept = useHandler(async () => {
    if (lobby?.loginRequest == null) return
    const { loginRequest } = lobby
    try {
      await loginRequest.approve()
      navigation.pop()
      await showOkModal(lstrings.send_scan_edge_login_success_title, lstrings.send_scan_edge_login_success_message)
    } catch (error: any) {
      navigation.pop()
      if (error.message.includes('Could not reach')) {
        await showOkModal(lstrings.edge_login_failed, lstrings.edge_login_fail_message)
      } else {
        showError(error)
      }
    }
  })

  const handleDecline = useHandler(() => navigation.goBack())
  const logoUri = theme.isDark ? lobby?.loginRequest?.displayImageDarkUrl : lobby?.loginRequest?.displayImageLightUrl

  return (
    <SceneWrapper background="theme">
      <View style={styles.topArea}>
        <CrossFade activeKey={lobby == null ? 'loader' : 'logo'}>
          <View key="loader" style={styles.header}>
            <ActivityIndicator color={theme.iconTappable} size="large" accessibilityHint={lstrings.spinner_hint} />
          </View>
          <View key="logo" style={styles.header}>
            <Image style={styles.logo} source={{ uri: logoUri }} resizeMode="contain" accessibilityHint={lstrings.app_logo_hint} />
            <TitleText style={styles.appName}>{lobby?.loginRequest?.displayName}</TitleText>
          </View>
        </CrossFade>
      </View>
      <Fade visible={lobby != null} delay={125}>
        <WarningCard title={lstrings.string_warning} header={warningMessage} />
      </Fade>
      <Fade visible={lobby != null} delay={250}>
        <MainButton label={lstrings.accept_button_text} onPress={handleAccept} marginRem={1} />
      </Fade>
      <MainButton label={lstrings.string_cancel_cap} onPress={handleDecline} type="escape" marginRem={[0, 1, 1]} />
    </SceneWrapper>
  )
}

const showOkModal = async (title: string, message: string) => {
  return await Airship.show<'ok' | undefined>(bridge => (
    <ButtonsModal bridge={bridge} buttons={{ ok: { label: lstrings.string_ok } }} message={message + '\n'} title={title} />
  ))
}

const getStyles = cacheStyles((theme: Theme) => ({
  topArea: {
    flex: 1
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1
  },
  logo: {
    alignSelf: 'stretch',
    flexGrow: 1,
    marginHorizontal: theme.rem(1),
    maxHeight: theme.rem(6)
  },
  appName: {
    padding: theme.rem(1)
  }
}))
