import Clipboard from '@react-native-clipboard/clipboard'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import { View } from 'react-native'

import { ENV } from '../../env'
import { useGiftCardProvider } from '../../hooks/useGiftCardProvider'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { makeCtxSpendApi } from '../../plugins/gift-cards/ctxSpendApi'
import type { CtxSpendAuthContext } from '../../plugins/gift-cards/ctxSpendTypes'
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
 * Outcome of a CTX spend-api session attempt. `isSupported: false` means the
 * account cannot hold a signing key, which is a different thing from an error.
 */
type CtxSpendStatus =
  | { isSupported: false }
  | {
      isSupported: true
      publicKeyHex: string | undefined
      authContext: CtxSpendAuthContext
      merchantCount: number
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

  // ---------------------------------------------------------------------------
  // CTX Spend prototype
  // ---------------------------------------------------------------------------

  const ctxSpendConfig = ENV.PLUGIN_API_KEYS?.ctxSpend
  const [isCtxRequested, setIsCtxRequested] = React.useState(false)

  const {
    data: ctxStatus,
    error: ctxError,
    isFetching: isCtxFetching,
    refetch: refetchCtxStatus
  } = useQuery({
    queryKey: ['ctxSpendStatus', account.id],
    queryFn: async (): Promise<CtxSpendStatus> => {
      if (ctxSpendConfig == null) throw new Error('CTX Spend is not configured')
      const api = makeCtxSpendApi({
        clientId: ctxSpendConfig.clientId,
        baseUrl: ctxSpendConfig.baseUrl
      })
      // A light account has nowhere to persist the signing key, so the
      // identity step is what gates the feature, not the network. Anything
      // else that goes wrong throws and surfaces through the query error.
      if ((await api.ensureIdentity(account)) === 'light-account') {
        return { isSupported: false }
      }

      const authContext = await api.getMe()
      const merchants = await api.getMerchants()
      return {
        isSupported: true,
        publicKeyHex: api.getPublicKeyHex(),
        authContext,
        merchantCount: merchants.pagination.total
      }
    },
    enabled: isCtxRequested && ctxSpendConfig != null,
    staleTime: 60000,
    // The app-wide default is `retry: 2`, which would turn one failed connect
    // into three full login handshakes against a rate-limited API. Retrying is
    // the Connect button's job, where the user decides when.
    retry: false
  })

  React.useEffect(() => {
    if (ctxError != null) showError(ctxError)
  }, [ctxError])

  const handleCtxConnect = useHandler(() => {
    // The button is disabled while fetching, so this cannot stack sessions.
    if (isCtxFetching) return
    // Already requested means a previous attempt resolved or failed, and
    // flipping the flag again would not re-run the query, so retry explicitly.
    if (isCtxRequested) {
      refetchCtxStatus().catch((err: unknown) => {
        showError(err)
      })
      return
    }
    setIsCtxRequested(true)
  })

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
    <SceneWrapper scroll>
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

        <CtxSpendSection
          isConfigured={ctxSpendConfig != null}
          isFetching={isCtxFetching}
          status={ctxStatus}
        />

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
          secondary={{
            label: isCtxFetching
              ? lstrings.ctx_spend_connecting
              : lstrings.ctx_spend_connect_button,
            onPress: handleCtxConnect,
            // Each run builds a fresh session and repeats the full login, so
            // stacked taps would burn CTX's rate limit for no benefit.
            disabled: isCtxFetching,
            spinner: isCtxFetching
          }}
        />
      </View>
    </SceneWrapper>
  )
}

interface CtxSpendSectionProps {
  isConfigured: boolean
  isFetching: boolean
  status: CtxSpendStatus | undefined
}

/**
 * Prototype readout for the CTX spend-api pubkey session: proves the app can
 * establish an anonymous keypair identity and read authenticated data.
 */
const CtxSpendSection: React.FC<CtxSpendSectionProps> = props => {
  const { isConfigured, isFetching, status } = props

  if (!isConfigured) {
    return <Paragraph>{lstrings.ctx_spend_not_configured}</Paragraph>
  }
  if (status == null) {
    return isFetching ? (
      <Paragraph>{lstrings.ctx_spend_connecting}</Paragraph>
    ) : null
  }
  if (!status.isSupported) {
    return <Paragraph>{lstrings.ctx_spend_unavailable_light_account}</Paragraph>
  }

  const { authContext, merchantCount, publicKeyHex } = status
  return (
    <EdgeCard sections>
      <EdgeRow
        title={lstrings.ctx_spend_section_title}
        body={authContext.client?.name ?? ''}
      />
      {publicKeyHex != null && (
        <EdgeRow title={lstrings.ctx_spend_public_key} body={publicKeyHex} />
      )}
      <EdgeRow title={lstrings.ctx_spend_user_id} body={authContext.user.id} />
      <EdgeRow
        title={lstrings.ctx_spend_user_name}
        body={authContext.user.name}
      />
      <EdgeRow
        title={lstrings.ctx_spend_company}
        body={authContext.company.name}
      />
      <EdgeRow
        title={lstrings.ctx_spend_permission_count}
        body={String(authContext.permissions.length)}
      />
      <EdgeRow
        title={lstrings.ctx_spend_merchant_count}
        body={String(merchantCount)}
      />
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    padding: theme.rem(0.5)
  }
}))
