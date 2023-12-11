import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { showBackupModal } from '../../actions/BackupModalActions'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { styled } from '../hoc/styled'
import { useTheme } from '../services/ThemeContext'
import { NotificationCard } from './NotificationCard'

interface Props {
  navigation: NavigationBase
}

const NotificationViewComponent = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)
  const detectedTokensRedux = useSelector(state => state.core.enabledDetectedTokens)
  const wallets = useWatch(account, 'currencyWallets')

  const isBackupWarningShown = account.username == null

  const [autoDetectTokenCards, setAutoDetectTokenCards] = React.useState<React.JSX.Element[]>([])

  const handlePress = useHandler(async () => {
    await showBackupModal({ navigation })
  })

  // Show a tokens detected notification per walletId found in newTokens
  React.useEffect(() => {
    const newNotifs: React.JSX.Element[] = []
    Object.keys(wallets).forEach(walletId => {
      const newTokens = detectedTokensRedux[walletId]

      const dismissNewTokens = (walletId: string) => {
        dispatch({
          type: 'CORE/DISMISS_NEW_TOKENS',
          data: { walletId }
        })
      }

      if (newTokens != null && newTokens.length > 0) {
        const { name, currencyInfo } = wallets[walletId]

        newNotifs.push(
          <NotificationCard
            key={walletId}
            type="info"
            title={lstrings.notif_tokens_detected_title}
            message={
              name == null || name.trim() === ''
                ? sprintf(lstrings.notif_tokens_detected_on_address_1s, currencyInfo.currencyCode)
                : sprintf(lstrings.notif_tokens_detected_on_wallet_name_1s, name)
            }
            onPress={() => {
              dismissNewTokens(walletId)
              // TODO: Would be helpful to highlight to the user which tokens
              // were just enabled on the next scene. Flashing rows?
              navigation.navigate('manageTokens', {
                walletId
              })
            }}
            onClose={() => dismissNewTokens(walletId)}
          />
        )
      }

      setAutoDetectTokenCards(newNotifs)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedTokensRedux, handlePress, theme])

  return (
    <NotificationCardsContainer>
      {isBackupWarningShown ? (
        <NotificationCard type="warning" title={lstrings.backup_title} message={lstrings.backup_warning_message} onPress={handlePress} />
      ) : null}
      {autoDetectTokenCards.length > 0 ? autoDetectTokenCards : null}
    </NotificationCardsContainer>
  )
}

const NotificationCardsContainer = styled(View)(theme => ({
  alignSelf: 'center',
  height: theme.rem(3.5),
  marginHorizontal: theme.rem(0.5),
  justifyContent: 'flex-end',
  bottom: theme.rem(0.25),
  position: 'absolute'
}))

/**
 * Manages which notification cards are shown in a persistent app-wide view.
 * Currently implemented with one card, but may be extended to handle more in
 * the future.
 */
export const NotificationView = React.memo(NotificationViewComponent)
