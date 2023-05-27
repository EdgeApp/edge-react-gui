import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import FastImage from 'react-native-fast-image'

import { logoutRequest } from '../../actions/LoginActions'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { getLightAccountIconUri } from '../../util/CdnUris'
import { BackupModal, BackupModalResult } from '../modals/BackupInfoModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Fade } from '../themed/Fade'

interface Props {
  visible?: boolean // Master toggle that trumps other visibility logic
  navigation: NavigationBase
}

const DUR_FADEIN = 250
const DUR_FADEOUT = 100

const FloatingCardComponent = (props: Props) => {
  const { visible = false, navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const loginStatus = useSelector(state => state.ui.settings.loginStatus ?? false)
  const activeUsername = useSelector(state => state.core.account.username)

  const isCardShown = visible && loginStatus && activeUsername == null

  const onPress = useHandler(() => {
    Airship.show((bridge: AirshipBridge<BackupModalResult | undefined>) => <BackupModal bridge={bridge} />).then((userSel?: BackupModalResult) => {
      if (userSel === 'upgrade') {
        // TODO: Implement upgrade flow, somehow pull existing light
        // account to change the name and password...
        dispatch(logoutRequest(navigation, activeUsername)).then(() => navigation.navigate('login', { loginUiInitialRoute: 'new-account' }))
      }
    })
  })

  return (
    <Fade visible={isCardShown} duration={isCardShown ? DUR_FADEIN : DUR_FADEOUT}>
      <TouchableOpacity onPress={!visible ? undefined : onPress}>
        <View style={styles.cardContainer}>
          <FastImage style={styles.icon} source={{ uri: getLightAccountIconUri(theme, 'icon-notif') }} />
          <View>
            <EdgeText style={styles.textTitle}>{lstrings.backup_title}</EdgeText>
            <EdgeText style={styles.textMessage} numberOfLines={3}>
              {lstrings.backup_warning_message}
            </EdgeText>
          </View>
        </View>
      </TouchableOpacity>
    </Fade>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  cardContainer: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: theme.rem(6),
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
