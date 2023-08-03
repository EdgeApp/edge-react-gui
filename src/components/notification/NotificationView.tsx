import * as React from 'react'
import { View } from 'react-native'

import { showBackupModal } from '../../actions/BackupModalActions'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { getLightAccountIconUri } from '../../util/CdnUris'
import { styled } from '../hoc/styled'
import { useTheme } from '../services/ThemeContext'
import { NotificationCard } from './NotificationCard'

interface Props {
  navigation: NavigationBase
}

const NotificationViewComponent = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()

  const activeUsername = useSelector(state => state.core.account.username)
  const isBackupWarningShown = activeUsername == null

  const handlePress = useHandler(async () => {
    await showBackupModal({ navigation })
  })

  return (
    <NotificationCardsContainer>
      {isBackupWarningShown ? (
        <NotificationCard
          iconUri={getLightAccountIconUri(theme, 'icon-notif')}
          title={lstrings.backup_title}
          message={lstrings.backup_warning_message}
          onPress={handlePress}
        />
      ) : null}
    </NotificationCardsContainer>
  )
}

const NotificationCardsContainer = styled(View)(theme => ({
  alignSelf: 'center',
  height: theme.rem(3.5),
  marginHorizontal: theme.rem(0.5),
  bottom: theme.rem(0.5),
  position: 'absolute'
}))

/**
 * Manages which notification cards are shown in a persistent app-wide view.
 * Currently implemented with one card, but may be extended to handle more in
 * the future.
 */
export const NotificationView = React.memo(NotificationViewComponent)
