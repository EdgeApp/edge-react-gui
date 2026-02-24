import Clipboard from '@react-native-clipboard/clipboard'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import { View } from 'react-native'

import { ENV } from '../../env'
import { useGiftCardProvider } from '../../hooks/useGiftCardProvider'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { SceneButtons } from '../buttons/SceneButtons'
import { EdgeCard } from '../cards/EdgeCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { ConfirmContinueModal } from '../modals/ConfirmContinueModal'
import { EdgeRow } from '../rows/EdgeRow'
import { Airship, showError, showToast } from '../services/AirshipInstance'
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
  const queryClient = useQueryClient()

  // Provider for identity lookup
  const phazeConfig = (ENV.PLUGIN_API_KEYS as Record<string, unknown>)
    ?.phaze as { apiKey?: string; baseUrl?: string } | undefined
  const { provider } = useGiftCardProvider({
    account,
    apiKey: phazeConfig?.apiKey ?? '',
    baseUrl: phazeConfig?.baseUrl ?? ''
  })

  const [isRevealed, setIsRevealed] = React.useState(false)

  const { data: identities = [], error } = useQuery({
    queryKey: ['phazeIdentities', account.id],
    queryFn: async () => {
      if (provider == null) throw new Error('Provider not ready')
      return await provider.listIdentities(account)
    },
    enabled: isRevealed && provider != null
  })

  React.useEffect(() => {
    if (error != null) showError(error)
  }, [error])

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
    if (!confirmed) return
    if (provider == null) return

    // Rotation must succeed before revealing the old email so the exposed
    // identity is never re-used for future purchases.
    try {
      await provider.rotateIdentity(account)
      await queryClient.invalidateQueries({
        queryKey: ['phazeProvider']
      })
    } catch (err: unknown) {
      showError(err)
      return
    }

    setIsRevealed(true)
    showToast(lstrings.gift_card_account_info_rotated)
  })

  const handleCopyAll = useHandler(async () => {
    const lines: string[] = []

    if (quoteId != null) {
      lines.push(`${lstrings.gift_card_quote_id_label}: ${quoteId}`)
    }

    identities.forEach(identity => {
      lines.push(`${lstrings.gift_card_account_info_email}: ${identity.email}`)
    })

    const text = lines.join('\n')
    Clipboard.setString(text)
    showToast(lstrings.fragment_copied)
  })

  return (
    <SceneWrapper scroll={isRevealed}>
      <View style={styles.container}>
        <Paragraph>{lstrings.gift_card_account_info_body}</Paragraph>

        {isRevealed && (
          <EdgeCard sections>
            {quoteId != null && (
              <EdgeRow
                title={lstrings.gift_card_quote_id_label}
                body={quoteId}
              />
            )}
            {identities.map(identity => (
              <EdgeRow
                key={String(identity.id)}
                title={lstrings.gift_card_account_info_email}
                body={identity.email}
              />
            ))}
          </EdgeCard>
        )}

        <SceneButtons
          primary={
            isRevealed
              ? {
                  label: lstrings.fragment_request_copy_title,
                  onPress: handleCopyAll
                }
              : {
                  label: lstrings.gift_card_account_info_reveal_button,
                  onPress: handleReveal
                }
          }
        />
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    padding: theme.rem(0.5)
  }
}))
