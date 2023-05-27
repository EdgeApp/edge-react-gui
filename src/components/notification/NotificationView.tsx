import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { logoutRequest } from '../../actions/LoginActions'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { getLightAccountIconUri } from '../../util/CdnUris'
import { styled } from '../hoc/styled'
import { BackupModal, BackupModalResult } from '../modals/BackupModal'
import { Airship } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { NotificationCard } from './NotificationCard'

/**
 * Manages which notification cards are shown in a persistent app-wide view
 */

const NotificationViewComponent = () => {
  const navigation = useNavigation<NavigationBase>()
  const theme = useTheme()
  const dispatch = useDispatch()

  const activeUsername = useSelector(state => state.core.account.username)
  const isCardShown = activeUsername == null

  React.useEffect(() => {
    if (isCardShown) {
      dispatch({
        type: 'IS_NOTIFICATION_VIEW_ACTIVE',
        data: { isNotificationViewActive: isCardShown }
      })
    }
  }, [dispatch, isCardShown])

  const handlePress = useHandler(() => {
    Airship.show((bridge: AirshipBridge<BackupModalResult | undefined>) => <BackupModal bridge={bridge} />).then((userSel?: BackupModalResult) => {
      if (userSel === 'upgrade') {
        // TODO: Implement upgrade flow, somehow pull existing light
        // account to change the name and password...
        dispatch(logoutRequest(navigation, activeUsername)).then(() => navigation.navigate('login', { loginUiInitialRoute: 'new-account' }))
      }
    })
  })

  return (
    <NotificationCardContainer>
      {isCardShown ? (
        <NotificationCard
          iconUri={getLightAccountIconUri(theme, 'icon-notif')}
          title={lstrings.backup_title}
          message={lstrings.backup_warning_message}
          onPress={handlePress}
        />
      ) : null}
    </NotificationCardContainer>
  )
}

const NotificationCardContainer = styled(View)(props => ({
  alignSelf: 'center',
  bottom: props.theme.rem(5),
  height: props.theme.rem(3.5),
  marginHorizontal: props.theme.rem(0.5),
  position: 'absolute'
}))

export const NotificationView = React.memo(NotificationViewComponent)
