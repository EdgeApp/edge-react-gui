import Clipboard from '@react-native-clipboard/clipboard'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { ENV } from '../../env'
import { useGiftCardProvider } from '../../hooks/useGiftCardProvider'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { makeCtxSpendApi } from '../../plugins/gift-cards/ctxSpendApi'
import {
  findWalletByPluginId,
  getCtxPaymentNativeAmount,
  getCtxPaymentPluginId,
  isCtxGiftCardPaid
} from '../../plugins/gift-cards/ctxSpendPurchase'
import type {
  CtxSpendAuthContext,
  CtxSpendGiftCard
} from '../../plugins/gift-cards/ctxSpendTypes'
import { config } from '../../theme/appConfig'
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
 * The card this prototype orders. CTX's staging catalogue only lets Amazon go
 * below a dollar, and every staging quote is testnet, where ETH is the one
 * chain Edge carries a wallet for.
 */
const CTX_TEST_MERCHANT_ID = '7c8bf315-703f-4b6c-972d-574411c059e9'
const CTX_TEST_FIAT_AMOUNT = '0.01'
const CTX_TEST_FIAT_CURRENCY = 'USD'
const CTX_TEST_CRYPTO_CURRENCY = 'ETH'

/**
 * Displays Phaze gift card account credentials behind a confirmation wall.
 * Accessible from the kebab menu (with quoteId context) or developer settings.
 */
export const GiftCardAccountInfoScene: React.FC<
  EdgeAppSceneProps<'giftCardAccountInfo'>
> = props => {
  const { navigation, route } = props
  const { quoteId } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const queryClient = useQueryClient()
  // This scene is NOT developer-only: GiftCardListScene routes here from "Get
  // Help" on a failed Phaze order, so production users reach it. The CTX
  // prototype is gated separately rather than riding that reachability.
  const developerModeOn = useSelector(
    state => state.ui.settings.developerModeOn
  )

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

  const ctxSpendConfig = developerModeOn
    ? ENV.PLUGIN_API_KEYS?.ctxSpend
    : undefined
  const [isCtxRequested, setIsCtxRequested] = React.useState(false)
  const [ctxCardId, setCtxCardId] = React.useState<string | undefined>()
  const [isCtxBuying, setIsCtxBuying] = React.useState(false)

  // One api instance for both the readout and the purchase, so they share a
  // session instead of each running its own login handshake.
  const ctxApi = React.useMemo(
    () =>
      ctxSpendConfig == null
        ? undefined
        : makeCtxSpendApi({
            clientId: ctxSpendConfig.clientId,
            baseUrl: ctxSpendConfig.baseUrl
          }),
    [ctxSpendConfig]
  )

  const {
    data: ctxStatus,
    error: ctxError,
    isFetching: isCtxFetching,
    refetch: refetchCtxStatus
  } = useQuery({
    queryKey: ['ctxSpendStatus', account.id],
    queryFn: async (): Promise<CtxSpendStatus> => {
      if (ctxApi == null) throw new Error('CTX Spend is not configured')
      const api = ctxApi
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
    enabled: isCtxRequested && ctxApi != null,
    staleTime: 60000,
    // The app-wide default is `retry: 2`, which would turn one failed connect
    // into three full login handshakes against a rate-limited API. Retrying is
    // the Connect button's job, where the user decides when.
    retry: false
  })

  React.useEffect(() => {
    if (ctxError != null) showError(ctxError)
  }, [ctxError])

  // Poll the ordered card until CTX credits the payment. The address is funded
  // by a real on-chain send, so this spans block confirmation.
  const { data: ctxCard } = useQuery({
    queryKey: ['ctxSpendCard', ctxCardId],
    queryFn: async (): Promise<CtxSpendGiftCard> => {
      if (ctxApi == null || ctxCardId == null) {
        throw new Error('CTX Spend is not configured')
      }
      return await ctxApi.getGiftCard(ctxCardId)
    },
    enabled: ctxCardId != null && ctxApi != null,
    // Stop once CTX credits the payment. Fulfilment past that point is the
    // merchant's, runs for far longer than a session, and polling it here
    // would hammer a rate-limited API for a value nothing acts on.
    refetchInterval: query => {
      const card = query.state.data
      return card != null && isCtxGiftCardPaid(card) ? false : 5000
    },
    retry: false
  })

  const buyCtxGiftCard = async (): Promise<void> => {
    if (ctxApi == null) return
    if ((await ctxApi.ensureIdentity(account)) === 'light-account') {
      showError(new Error(lstrings.ctx_spend_unavailable_light_account))
      return
    }

    const giftCard = await ctxApi.createGiftCard({
      merchantId: CTX_TEST_MERCHANT_ID,
      fiatAmount: CTX_TEST_FIAT_AMOUNT,
      fiatCurrency: CTX_TEST_FIAT_CURRENCY,
      cryptoCurrency: CTX_TEST_CRYPTO_CURRENCY
    })
    const { paymentCryptoAddress: address } = giftCard
    if (address == null || address === '') {
      throw new Error(lstrings.ctx_spend_no_payment_address)
    }
    const pluginId = getCtxPaymentPluginId(giftCard)
    if (pluginId == null) {
      throw new Error(
        sprintf(
          lstrings.ctx_spend_unsupported_payment_3s,
          config.appName,
          giftCard.paymentCryptoChain ?? '',
          giftCard.paymentCryptoNetwork ?? ''
        )
      )
    }
    const wallet = findWalletByPluginId(account, pluginId)
    if (wallet == null) {
      throw new Error(sprintf(lstrings.ctx_spend_no_wallet_1s, pluginId))
    }

    const nativeAmount = getCtxPaymentNativeAmount(giftCard, wallet)

    // Track the card only now that it is payable. Doing it at creation time
    // would start the poll for an order the app cannot pay, leaving it
    // orphaned and polling a rate-limited API every 5s for nothing.
    setCtxCardId(giftCard.id)

    navigation.navigate('send2', {
      walletId: wallet.id,
      tokenId: null,
      spendInfo: {
        tokenId: null,
        spendTargets: [{ publicAddress: address, nativeAmount }],
        metadata: {
          name: giftCard.merchantName,
          notes: `CTX Spend gift card ${giftCard.cardFiatAmount} ${giftCard.cardFiatCurrency}\nCard ID: ${giftCard.id}`
        }
      },
      lockTilesMap: { address: true, amount: true, wallet: true },
      hiddenFeaturesMap: { address: true, fioAddressSelect: true },
      infoTiles: [
        {
          label: lstrings.ctx_spend_card_merchant,
          value: giftCard.merchantName
        },
        {
          label: lstrings.ctx_spend_card_face_value,
          value: `${giftCard.cardFiatAmount} ${giftCard.cardFiatCurrency}`
        },
        {
          label: lstrings.ctx_spend_card_network,
          value: `${giftCard.paymentCryptoChain ?? ''} ${
            giftCard.paymentCryptoNetwork ?? ''
          }`
        }
      ],
      // Supplying `onDone` at all is what keeps the send scene from replacing
      // itself with the transaction details scene: it pops back here instead,
      // where the poll above shows the card being fulfilled. The pop is the
      // send scene's own, so there is nothing to do here.
      onDone: () => {}
    })
  }

  const handleCtxBuy = useHandler(() => {
    if (isCtxBuying) return
    setIsCtxBuying(true)
    buyCtxGiftCard()
      .catch((err: unknown) => {
        showError(err)
      })
      .finally(() => {
        setIsCtxBuying(false)
      })
  })

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

        {developerModeOn && (
          <CtxSpendSection
            isConfigured={ctxSpendConfig != null}
            isFetching={isCtxFetching}
            status={ctxStatus}
          />
        )}

        {developerModeOn && <CtxSpendCardSection card={ctxCard} />}

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
          secondary={
            developerModeOn
              ? {
                  label: isCtxFetching
                    ? lstrings.ctx_spend_connecting
                    : lstrings.ctx_spend_connect_button,
                  onPress: handleCtxConnect,
                  // Each run builds a fresh session and repeats the full
                  // login, so stacked taps burn CTX's rate limit for nothing.
                  disabled: isCtxFetching,
                  spinner: isCtxFetching
                }
              : undefined
          }
          tertiary={
            developerModeOn
              ? {
                  label: isCtxBuying
                    ? lstrings.ctx_spend_buying
                    : lstrings.ctx_spend_buy_button,
                  onPress: handleCtxBuy,
                  // Each tap orders a real card and allocates an address.
                  disabled: isCtxBuying || ctxSpendConfig == null,
                  spinner: isCtxBuying
                }
              : undefined
          }
        />
      </View>
    </SceneWrapper>
  )
}

interface CtxSpendCardSectionProps {
  card: CtxSpendGiftCard | undefined
}

/**
 * Live state of the ordered card: what to pay, and how far CTX has got with
 * the payment and the fulfilment.
 */
const CtxSpendCardSection: React.FC<CtxSpendCardSectionProps> = props => {
  const { card } = props
  if (card == null) return null

  return (
    <EdgeCard sections>
      <EdgeRow title={lstrings.ctx_spend_card_id} body={card.id} />
      <EdgeRow
        title={lstrings.ctx_spend_card_merchant}
        body={card.merchantName}
      />
      <EdgeRow
        title={lstrings.ctx_spend_card_face_value}
        body={`${card.cardFiatAmount} ${card.cardFiatCurrency}`}
      />
      <EdgeRow
        title={lstrings.ctx_spend_card_pay_amount}
        body={`${card.paymentCryptoAmount ?? ''} ${
          card.paymentCryptoCurrency ?? ''
        }`}
      />
      <EdgeRow
        title={lstrings.ctx_spend_card_network}
        body={`${card.paymentCryptoChain ?? ''} ${
          card.paymentCryptoNetwork ?? ''
        }`}
      />
      <EdgeRow
        title={lstrings.ctx_spend_card_payment_status}
        body={card.paymentStatus ?? card.status}
      />
      <EdgeRow
        title={lstrings.ctx_spend_card_fulfilment_status}
        body={card.fulfilmentStatus ?? card.status}
      />
    </EdgeCard>
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
