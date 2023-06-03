import { DrawerStatusContext } from '@react-navigation/drawer'
import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { Animated, TouchableOpacity, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import FastImage from 'react-native-fast-image'

import { logoutRequest } from '../../actions/LoginActions'
import { useFadeAnimation } from '../../hooks/animations/useFadeAnimation'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { getLightAccountIconUri } from '../../util/CdnUris'
import { BackupModal, BackupModalResult } from '../modals/BackupInfoModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Fade } from '../themed/Fade'

interface Props {
  navigation: NavigationBase
  bridge: AirshipBridge<void>
  isDrawerOpen: boolean
}

const DUR_FADEIN = 250
const DUR_FADEOUT = 100

const FloatingCardComponent = (props: Props) => {
  const { navigation, isDrawerOpen } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  // const isDrawerOpen = React.useContext(DrawerStatusContext)
  console.debug('isDrawerOpen: ' + isDrawerOpen)

  const loginStatus = useSelector(state => state.ui.settings.loginStatus ?? false)
  const activeUsername = useSelector(state => state.core.account.username)

  const isCardShown = !isDrawerOpen && loginStatus // && true // activeUsername == null

  const handlePress = useHandler(() => {
    Airship.show((bridge: AirshipBridge<BackupModalResult | undefined>) => <BackupModal bridge={bridge} />).then((userSel?: BackupModalResult) => {
      if (userSel === 'upgrade') {
        // TODO: Implement upgrade flow, somehow pull existing light
        // account to change the name and password...
        dispatch(logoutRequest(navigation, activeUsername)).then(() => navigation.navigate('login', { loginUiInitialRoute: 'new-account' }))
        // bridge.resolve()
      }
    })
  })

  const fadeStyle = useFadeAnimation(isCardShown, { noFadeIn: true, duration: isCardShown ? DUR_FADEIN : DUR_FADEOUT, delay: 0 })

  return (
    <Animated.View style={isCardShown ? [fadeStyle, styles.cardContainer] : { opacity: 0 }} pointerEvents="auto">
      {/* <TouchableOpacity style={} onPress={handlePress}> */}
      <FastImage style={styles.icon} source={{ uri: getLightAccountIconUri(theme, 'icon-notif') }} />
      <View>
        <EdgeText style={styles.textTitle}>{lstrings.backup_title}</EdgeText>
        <EdgeText style={styles.textMessage} numberOfLines={3}>
          {lstrings.backup_warning_message}
        </EdgeText>
      </View>
      {/* </TouchableOpacity> */}
    </Animated.View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  cardContainer: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: theme.rem(5),
    height: theme.rem(3.5),
    backgroundColor: theme.modal,
    borderRadius: theme.rem(0.5),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: theme.rem(0.5),
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: theme.rem(0.5),
    padding: theme.rem(0.5)
  },
  icon: {
    height: theme.rem(2.5),
    width: theme.rem(2.5)
  },
  textTitle: {
    color: theme.warningIcon,
    marginLeft: theme.rem(0.5),
    fontSize: theme.rem(0.75),
    fontFamily: theme.fontFaceBold
  },
  textMessage: {
    color: theme.warningIcon,
    marginLeft: theme.rem(0.5),
    fontSize: theme.rem(0.75)
  }
}))

export const FloatingCard = React.memo(FloatingCardComponent)
