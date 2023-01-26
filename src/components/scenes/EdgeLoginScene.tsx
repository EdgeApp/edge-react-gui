import { EdgeLobby } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Image, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import s from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { NavigationBase, RouteProp } from '../../types/routerTypes'
import { WarningCard } from '../cards/WarningCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { TitleText } from '../text/TitleText'
import { Fade } from '../themed/Fade'
import { MainButton } from '../themed/MainButton'

interface Props {
  navigation: NavigationBase
  route: RouteProp<'edgeLogin'>
}

export const EdgeLoginScene = (props: Props) => {
  const { navigation, route } = props
  const { account } = useSelector(state => state.core)
  const { lobbyId } = route.params
  const [lobby, setLobby] = React.useState<EdgeLobby | undefined>(undefined)
  const [isApproved, setIsApproved] = React.useState<boolean>(false)
  const isLobby = lobby != null
  const isLoading = !isLobby || isApproved
  const warningMessage = sprintf(s.strings.edge_description_warning, config.appName)
  const theme = useTheme()
  const styles = getStyles(theme)

  useAsyncEffect(async () => {
    await account
      .fetchLobby(lobbyId)
      .then((lobby: EdgeLobby) => {
        setLobby(lobby)
      })
      .catch((e: any) => {
        if (e.message.includes('Account does not')) {
          showOkModal(s.strings.edge_login_failed, s.strings.edge_login_fail_stale_qr)
        } else {
          showError(e)
        }
        navigation.pop()
      })
  }, [lobbyId])

  const handleAccept = async () => {
    if (lobby?.loginRequest == null) return
    setIsApproved(true)
    const { loginRequest } = lobby
    await loginRequest
      .approve()
      .then(() => {
        navigation.pop()
        showOkModal(s.strings.send_scan_edge_login_success_title, s.strings.send_scan_edge_login_success_message)
      })
      .catch((e: any) => {
        navigation.pop()
        if (e.message.includes('Could not reach')) {
          showOkModal(s.strings.edge_login_failed, s.strings.edge_login_fail_message)
        } else {
          showError(e)
        }
      })
  }

  const showOkModal = async (title: string, message: string) => {
    return Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal bridge={bridge} buttons={{ ok: { label: s.strings.string_ok } }} message={message + '\n'} title={title} />
    ))
  }

  const handleDecline = () => navigation.goBack()

  return (
    <SceneWrapper background="theme">
      <View style={styles.container}>
        <View style={styles.header}>
          <Image style={styles.logo} source={theme.primaryLogo} resizeMode="contain" />
          <TitleText style={styles.appName}>{config.appName}</TitleText>
        </View>
        <View style={styles.loader}>
          <Fade visible={isLoading} noFadeIn>
            <ActivityIndicator color={theme.iconTappable} size="large" />
          </Fade>
        </View>
        <View style={styles.container}>
          <Fade visible={!isLoading} delay={125}>
            <WarningCard title={s.strings.string_warning} header={warningMessage} />
          </Fade>
          <View>
            <Fade visible={isLobby} delay={250}>
              <MainButton label={s.strings.accept_button_text} onPress={handleAccept} marginRem={1} />
            </Fade>
            <Fade visible={isLobby} delay={500}>
              <MainButton label={s.strings.string_cancel_cap} onPress={handleDecline} type="escape" marginRem={[0, 0, 1, 0]} />
            </Fade>
          </View>
        </View>
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    alignSelf: 'center',
    justifyContent: 'space-between',
    flex: 1
  },
  logo: {
    height: theme.rem(6),
    width: theme.rem(12)
  },
  appName: {
    fontSize: theme.rem(1.25),
    paddingTop: theme.rem(1)
  },
  header: {
    alignItems: 'center'
  },
  loader: {
    opacity: 0.5,
    paddingVertical: theme.rem(1.5),
    height: theme.rem(4)
  }
}))
