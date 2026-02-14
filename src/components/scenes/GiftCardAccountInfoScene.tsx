import * as React from 'react'
import { View } from 'react-native'

import { ENV } from '../../env'
import { useGiftCardProvider } from '../../hooks/useGiftCardProvider'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { PhazeUser } from '../../plugins/gift-cards/phazeGiftCardTypes'
import { useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { EdgeButton } from '../buttons/EdgeButton'
import { EdgeCard } from '../cards/EdgeCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { ConfirmContinueModal } from '../modals/ConfirmContinueModal'
import { EdgeRow } from '../rows/EdgeRow'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { Paragraph } from '../themed/EdgeText'

export interface GiftCardAccountInfoParams {
  quoteId?: string
}

/**
 * Displays Phaze gift card account credentials behind a confirmation wall.
 * Accessible from the kebab menu (with quoteId context) or developer settings.
 */
export const GiftCardAccountInfoScene: React.FC<
  EdgeAppSceneProps<'giftCardAccountInfo'>
> = props => {
  const { route } = props
  const { quoteId } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)

  // Provider for identity lookup
  const phazeConfig = (ENV.PLUGIN_API_KEYS as Record<string, unknown>)
    ?.phaze as { apiKey?: string; baseUrl?: string } | undefined
  const { provider } = useGiftCardProvider({
    account,
    apiKey: phazeConfig?.apiKey ?? '',
    baseUrl: phazeConfig?.baseUrl ?? ''
  })

  const [isRevealed, setIsRevealed] = React.useState(false)
  const [identities, setIdentities] = React.useState<PhazeUser[]>([])

  // Load identities when provider is ready
  React.useEffect(() => {
    if (provider == null) return
    provider
      .listIdentities(account)
      .then(setIdentities)
      .catch(() => {})
  }, [account, provider])

  const handleReveal = useHandler(async () => {
    const confirmed = await Airship.show<boolean>(bridge => (
      <ConfirmContinueModal
        bridge={bridge}
        title={lstrings.gift_card_account_info_title}
        body={lstrings.gift_card_account_info_warning}
        warning
        onPress={async () => true}
      />
    ))
    if (confirmed) {
      setIsRevealed(true)
    }
  })

  return (
    <SceneWrapper scroll={isRevealed}>
      <View style={[styles.container, !isRevealed && styles.containerFill]}>
        <Paragraph>{lstrings.gift_card_account_info_body}</Paragraph>

        {quoteId != null ? (
          <EdgeCard>
            <EdgeRow
              title={lstrings.gift_card_quote_id_label}
              body={quoteId}
              rightButtonType="copy"
            />
          </EdgeCard>
        ) : null}

        {!isRevealed ? (
          <View style={styles.buttonContainer}>
            <EdgeButton
              label={lstrings.gift_card_account_info_reveal_button}
              type="primary"
              onPress={handleReveal}
            />
          </View>
        ) : (
          <EdgeCard sections>
            {identities.map((identity, index) => (
              <View key={String(identity.id)}>
                <EdgeRow
                  title={lstrings.gift_card_account_info_email}
                  body={identity.email}
                  rightButtonType="copy"
                />
                <EdgeRow
                  title={lstrings.gift_card_account_info_user_id}
                  body={String(identity.id)}
                  rightButtonType="copy"
                />
              </View>
            ))}
          </EdgeCard>
        )}
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    padding: theme.rem(0.5)
  },
  containerFill: {
    flex: 1
  },
  buttonContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const
  }
}))
