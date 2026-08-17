import { abs, add, div, gte, lt, lte, mul, sub, toFixed } from 'biggystring'
import { asMaybe } from 'cleaners'
import {
  asMaybeInsufficientFundsError,
  asMaybeNoAmountSpecifiedError,
  asMaybeSwapCurrencyError,
  type EdgeAccount,
  type EdgeCurrencyConfig,
  type EdgeCurrencyWallet,
  type EdgeDenomination,
  type EdgeMemo,
  type EdgeMemoOption,
  type EdgeSpendInfo,
  type EdgeSpendTarget,
  type EdgeSwapQuote,
  type EdgeTokenId,
  type EdgeTransaction,
  type EdgeTxActionSwapType,
  type InsufficientFundsError
} from 'edge-core-js'
import * as React from 'react'
import {
  ActivityIndicator,
  InteractionManager,
  Linking,
  type TextInput,
  View
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { sprintf } from 'sprintf-js'

import type { GuiExchangeRates } from '../../actions/ExchangeRateActions'
import { showSendScamWarningModal } from '../../actions/ScamWarningActions'
import { checkAndShowGetCryptoModal } from '../../actions/ScanActions'
import { playSendSound } from '../../actions/SoundActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import {
  FIO_STR,
  getFiatSymbol,
  getSpecialCurrencyInfo
} from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { formatFiatString } from '../../hooks/useFiatText'
import { useHandler } from '../../hooks/useHandler'
import { useIconColor } from '../../hooks/useIconColor'
import { useMount } from '../../hooks/useMount'
import { useUnmount } from '../../hooks/useUnmount'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { getExchangeDenom } from '../../selectors/DenominationSelectors'
import {
  convertCurrency,
  getExchangeRate,
  getFiatRate
} from '../../selectors/WalletSelectors'
import { config } from '../../theme/appConfig'
import { useState } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps, NavigationBase } from '../../types/routerTypes'
import type { EdgeAsset, FioRequest } from '../../types/types'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import {
  addToFioAddressCache,
  checkRecordSendFee,
  FIO_FEE_EXCEEDS_SUPPLIED_MAXIMUM,
  FIO_NO_BUNDLED_ERR_CODE,
  FioError,
  recordSend
} from '../../util/FioAddressUtils'
import {
  detectHoudiniChains,
  getHoudiniChain,
  getRecipientAsset,
  getRecipientAssetChoices,
  HOUDINI_CHAINS,
  HOUDINI_MIN_USD,
  type HoudiniChain,
  isValidHoudiniAddress,
  recipientAssetKey,
  schemeNamesChain
} from '../../util/houdiniChains'
import { logActivity } from '../../util/logger'
import {
  createEdgeMemo,
  getLegacyUniqueIdentifier,
  getMemoError,
  getMemoLabel,
  getMemoTitle
} from '../../util/memoUtils'
import { parsePaymentUri } from '../../util/paymentUri'
import {
  hasParentFeeRow,
  makeStealthSwapRequestOptions
} from '../../util/stealthSwap'
import { processSwapQuoteError } from '../../util/swapErrorDisplay'
import {
  convertTransactionFeeToDisplayFee,
  darkenHexColor,
  DECIMAL_PRECISION,
  zeroString
} from '../../util/utils'
import { AlertCardUi4 } from '../cards/AlertCard'
import { EdgeCard } from '../cards/EdgeCard'
import { ErrorCard, I18nError } from '../cards/ErrorCard'
import type { AccentColors } from '../common/DotsBackground'
import { EdgeAnim } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { CryptoIcon } from '../icons/CryptoIcon'
import { ButtonsModal } from '../modals/ButtonsModal'
import {
  FlipInputModal2,
  type FlipInputModalRef,
  type FlipInputModalResult
} from '../modals/FlipInputModal2'
import { showInsufficientFeesModal } from '../modals/InsufficientFeesModal'
import { RadioListModal } from '../modals/RadioListModal'
import { TextInputModal } from '../modals/TextInputModal'
import {
  WalletListModal,
  type WalletListResult
} from '../modals/WalletListModal'
import { EdgeRow } from '../rows/EdgeRow'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { SettingsSwitchRow } from '../settings/SettingsSwitchRow'
import { FiatText } from '../text/FiatText'
import { UnscaledTextInput } from '../text/UnscaledTextInput'
import { EdgeText, PositiveText, WarningText } from '../themed/EdgeText'
import type {
  ExchangedFlipInputAmounts,
  ExchangeFlipInputFields
} from '../themed/ExchangedFlipInput2'
import { asPrivateNetworkingSetting } from '../themed/MaybePrivateNetworkingSetting'
import { PinDots } from '../themed/PinDots'
import {
  calculateQuotePriceImpact,
  PriceImpactText
} from '../themed/PriceImpactText'
import { SafeSlider } from '../themed/SafeSlider'
import { SendFromFioRows } from '../themed/SendFromFioRows'
import { StealthInfoText } from '../themed/StealthInfoText'
import {
  type AddressEntryMethod,
  AddressTile2,
  type ChangeAddressResult
} from '../tiles/AddressTile2'
import { CountdownTile } from '../tiles/CountdownTile'
import { EditableAmountTile } from '../tiles/EditableAmountTile'

// TODO: Check contentPadding

const SCROLL_TO_END_DELAY_MS = 150

type Props = EdgeAppSceneProps<'send2'>

export interface SendScene2Params {
  walletId: string
  tokenId: EdgeTokenId
  dismissAlert?: boolean
  isoExpireDate?: string
  minNativeAmount?: string
  spendInfo?: EdgeSpendInfo
  openCamera?: boolean
  lockTilesMap?: {
    address?: boolean
    amount?: boolean
    fee?: boolean
    wallet?: boolean
  }
  hiddenFeaturesMap?: {
    address?: boolean
    amount?: boolean
    fioAddressSelect?: boolean
    scamWarning?: boolean
  }
  infoTiles?: Array<{
    label: string
    value: string
    /**
     * Row height cap, defaulting to EdgeRow's 3 lines. A value longer than the
     * cap is not merely clipped - EdgeText shrinks it to as little as 65% of
     * its size to fit - so paragraph-length values want 'large' (unlimited).
     */
    maximumHeight?: 'small' | 'medium' | 'large'
  }>
  // Custom React node rendered directly above the slider
  sliderTopNode?: React.ReactNode
  fioPendingRequest?: FioRequest
  onBack?: () => void
  onDone?: (
    error: Error | null,
    edgeTransaction?: EdgeTransaction
  ) => void | Promise<void>
  /**
   * Called when the quote expires (isoExpireDate countdown reaches zero).
   * If provided, handles expiry smoothly without showing an error.
   * If not provided, falls back to displaying an expiry error message.
   */
  onExpired?: () => void
  beforeTransaction?: () => Promise<void>
  alternateBroadcast?: (
    edgeTransaction: EdgeTransaction
  ) => Promise<EdgeTransaction>
  // Useful to disable during for test runtime
  doCheckAndShowGetCryptoModal?: boolean
}

interface FioSenderInfo {
  fioAddress: string
  fioWallet: EdgeCurrencyWallet | null
  fioError: string
  memo: string
  memoError: string
  skipRecord?: boolean
}

/** One side of a swap row's inline fiat value, rendered by `FiatText`. */
interface SwapRowFiat {
  nativeAmount: string
  tokenId: EdgeTokenId
  currencyConfig: EdgeCurrencyConfig
}

const ALLOW_MULTIPLE_TARGETS = true

/**
 * If the prior two spend targets of a multi-out payment have the same amount
 * within 0.5%, then use the same amount for the new spend target.
 * This makes it MUCH easier to load many gift cards without having to enter
 * amounts manually.
 */
const MULTI_OUT_DIFF_PERCENT = '0.005'
const PIN_MAX_LENGTH = 4
const INFINITY_STRING = '999999999999999999999999999999999999999'

/**
 * Checks if a wallet is EVM-based by looking at its WalletConnect v2 chain ID
 * namespace. EVM chains use the 'eip155' namespace.
 */
const isEvmWallet = (wallet: EdgeCurrencyWallet): boolean => {
  const { pluginId } = wallet.currencyInfo
  const specialInfo = getSpecialCurrencyInfo(pluginId)
  return specialInfo.walletConnectV2ChainId?.namespace === 'eip155'
}

const SendComponent: React.FC<Props> = props => {
  const { route, navigation } = props
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const needsScrollToEnd = React.useRef<boolean>(false)
  const makeSpendCounter = React.useRef<number>(0)
  const scrollViewRef = React.useRef<KeyboardAwareScrollView | null>(null)
  const isSendingRef = React.useRef<boolean>(false)

  const initialMount = React.useRef<boolean>(true)
  const pinInputRef = React.useRef<TextInput>(null)
  const flipInputModalRef = React.useRef<FlipInputModalRef>(null)
  const {
    walletId: initWalletId = '',
    tokenId: tokenIdProp,
    dismissAlert = false,
    fioPendingRequest,
    spendInfo: initSpendInfo,
    isoExpireDate,
    minNativeAmount: initMinNativeAmount,
    openCamera = false,
    infoTiles,
    sliderTopNode,
    lockTilesMap = {},
    hiddenFeaturesMap = {},
    onDone,
    onBack,
    onExpired,
    beforeTransaction,
    alternateBroadcast,
    doCheckAndShowGetCryptoModal = true
  } = route.params

  const openCameraRef = React.useRef<boolean>(openCamera)
  const initExpireDate =
    isoExpireDate != null ? new Date(isoExpireDate) : undefined
  const [processingAmountChanged, setProcessingAmountChanged] =
    React.useState<boolean>(false)
  const [walletId, setWalletId] = useState<string>(initWalletId)
  const [fieldChanged, setFieldChanged] =
    useState<ExchangeFlipInputFields>('fiat')
  const [feeNativeAmount, setFeeNativeAmount] = useState<string>('')
  const [minNativeAmount, setMinNativeAmount] = useState<string | undefined>(
    initMinNativeAmount
  )
  const [expireDate, setExpireDate] = useState<Date | undefined>(initExpireDate)
  /** Whether the payment request's own countdown has run out. */
  const [addressExpired, setAddressExpiredState] = useState<boolean>(false)
  /**
   * Mirror of `addressExpired` for the error-owner helpers below, which are
   * also called from async effects holding an older render's closure.
   */
  const addressExpiredRef = React.useRef<boolean>(false)
  const setAddressExpired = (value: boolean): void => {
    addressExpiredRef.current = value
    setAddressExpiredState(value)
  }
  const [error, setError] = useState<unknown | undefined>(undefined)
  const [edgeTransaction, setEdgeTransaction] =
    useState<EdgeTransaction | null>(null)
  const [pinValue, setPinValue] = useState<string | undefined>(undefined)
  const [lastAddressEntryMethod, setLastAddressEntryMethod] = useState<
    AddressEntryMethod | undefined
  >(undefined)
  const [hasPendingTx, setHasPendingTx] = useState<boolean>(false)
  const [fioSender, setFioSender] = useState<FioSenderInfo>({
    fioAddress: fioPendingRequest?.payer_fio_address ?? '',
    fioWallet: null,
    fioError: '',
    memo: fioPendingRequest?.content.memo ?? '',
    memoError: ''
  })

  // -1 = no max spend, otherwise equal to the index the spendTarget that requested the max spend.
  const [maxSpendSetter, setMaxSpendSetter] = useState<number>(-1)

  // Send-to-address swap state (Stealth Send / cross-asset recipient). The
  // recipient asset defaults to the source asset (undefined); picking another
  // chain, or enabling stealth, turns the send into a swap-to-address quote.
  const [recipientPluginId, setRecipientPluginId] = useState<
    string | undefined
  >(undefined)
  const [stealth, setStealth] = useState<boolean>(false)
  const [destinationTag, setDestinationTag] = useState<string | undefined>(
    undefined
  )
  const [swapQuote, setSwapQuote] = useState<EdgeSwapQuote | undefined>(
    undefined
  )
  const [fetchingSwapQuote, setFetchingSwapQuote] = useState<boolean>(false)
  const [guaranteedSide, setGuaranteedSide] = useState<'send' | 'receive'>(
    'send'
  )
  // The fixed receive amount (destination-chain native units) when the user
  // edits "Recipient gets"; otherwise the latest quote's estimate.
  const [receiveNativeAmount, setReceiveNativeAmount] = useState<
    string | undefined
  >(undefined)
  // Bumped when the quote expires, to force a re-quote:
  const [swapQuoteNonce, setSwapQuoteNonce] = useState<number>(0)
  // Route capabilities learned from the provider's live answers, keyed by
  // `${sourcePluginId}:${tokenId}->${destPluginId}`. Availability is a live
  // provider property (routes appear and disappear between sessions), so the
  // scene learns it from real quote failures and reflects it pre-emptively
  // from then on, rather than trusting a static table that would go stale.
  const [routeCaps, setRouteCaps] = useState<
    Record<string, { stealth?: boolean; fixedTo?: boolean }>
  >({})
  // A fixed receive amount was abandoned because the provider offers no
  // receive-priced route for the pair. Shows the warning card until the user
  // edits an amount or changes the destination:
  const [fixedToFallback, setFixedToFallback] = useState<boolean>(false)
  // The fixed-to fallback wanted to seed a send amount but had no exchange rate
  // to seed it from. Cleared by the one retry that fires when rates arrive.
  const [rateStarvedFallback, setRateStarvedFallback] = useState<boolean>(false)
  const isApprovingSwapRef = React.useRef<boolean>(false)
  // Quote requests are not cancellable, so each one carries a generation and
  // only the newest is allowed to write state. Without this a slow response
  // for a superseded amount lands last and wins.
  const swapQuoteGeneration = React.useRef<number>(0)
  // The live quote, for the one read that resumes after an await. The slider
  // awaits the PIN check before approving, and every term the quote was priced
  // against retires it meanwhile, so the closed-over `swapQuote` can still name
  // an order the scene has already dropped.
  const swapQuoteRef = React.useRef<EdgeSwapQuote | undefined>(undefined)

  const countryCode = useSelector(state => state.ui.countryCode)
  const account = useSelector<EdgeAccount>(state => state.core.account)
  const exchangeRates = useSelector<GuiExchangeRates>(
    state => state.exchangeRates
  )
  const pinSpendingLimitsEnabled = useSelector<boolean>(
    state => state.ui.settings.spendingLimits.transaction.isEnabled
  )
  const pinSpendingLimitsAmount = useSelector<number>(
    state => state.ui.settings.spendingLimits.transaction.amount ?? 0
  )
  const defaultIsoFiat = useSelector<string>(
    state => state.ui.settings.defaultIsoFiat
  )
  const hasNotifications = useSelector(state => state.ui.notificationHeight > 0)

  /**
   * Whether the error currently on screen came from the swap-send path. The
   * `error` state is shared with the plain-send `makeSpend` effect, which owns
   * its own failures, so leaving swap-send mode may only retract a swap error
   * and must never clear an insufficient-funds message that effect put there.
   */
  const swapErrorShown = React.useRef<boolean>(false)
  const setSwapError = (value: unknown): void => {
    swapErrorShown.current = value != null
    setError(value)
  }
  const clearSwapError = (): void => {
    if (!swapErrorShown.current) return
    swapErrorShown.current = false
    setError(undefined)
  }
  /** The converse: retract a plain-send error without touching a swap one. */
  const clearPlainSendError = (): void => {
    if (swapErrorShown.current) return
    // The expiry message belongs to the REQUEST, not to either send mode, and
    // the slider stays disabled on it either way. Retracting it here left the
    // user looking at a dead slider with nothing on screen explaining why.
    if (addressExpiredRef.current) return
    setError(undefined)
  }

  /**
   * Live exchange rates, for the quote effect's fixed-to fallback to read.
   * The fallback needs current rates, but the effect must NOT re-run on a rate
   * tick: rates update constantly and the provider rate-limits tight traffic,
   * so depending on them would fire a quote request every few seconds. A ref
   * gives the fallback today's rates without making them a trigger.
   */
  const ratesRef = React.useRef({
    rates: exchangeRates,
    isoFiat: defaultIsoFiat
  })
  ratesRef.current = { rates: exchangeRates, isoFiat: defaultIsoFiat }

  const currencyWallets = useWatch(account, 'currencyWallets')
  const coreWallet = currencyWallets[walletId]
  const { pluginId, memoOptions = [] } = coreWallet.currencyInfo

  const userSettings = useWatch(coreWallet.currencyConfig, 'userSettings')
  const isNymActive =
    asMaybe(asPrivateNetworkingSetting)(userSettings)?.networkPrivacy === 'nym'

  // Initialize `spendInfo` from route params, including possible memos
  const [spendInfo, setSpendInfo] = useState<EdgeSpendInfo>(() => {
    if (initSpendInfo == null) return { tokenId: null, spendTargets: [{}] }

    const spendTarget = initSpendInfo.spendTargets[0]
    const legacyUniqueIdentifier = getLegacyUniqueIdentifier(spendTarget)

    if (legacyUniqueIdentifier == null || spendTarget.publicAddress == null) {
      return initSpendInfo
    } else {
      return {
        ...initSpendInfo,
        memos: [createEdgeMemo(memoOptions, legacyUniqueIdentifier)]
      }
    }
  })

  const [tokenId, setTokenId] = useState<EdgeTokenId>(
    spendInfo.tokenId ?? tokenIdProp
  )
  const currencyCode = getCurrencyCode(coreWallet, tokenId)
  const cryptoDisplayDenomination = useDisplayDenom(
    coreWallet.currencyConfig,
    tokenId
  )
  const cryptoExchangeDenomination = getExchangeDenom(
    coreWallet.currencyConfig,
    tokenId
  )
  const parentDisplayDenom = useDisplayDenom(coreWallet.currencyConfig, null)
  const parentExchangeDenom = getExchangeDenom(coreWallet.currencyConfig, null)
  const iconColor = useIconColor({ pluginId, tokenId })

  spendInfo.tokenId = tokenId

  // ---------------------------------------------------------------------
  // Send-to-address swap mode (Stealth Send / cross-asset recipient)
  // ---------------------------------------------------------------------

  // The send-to-address swap UI is offered only when this scene is a plain,
  // unconstrained send. Callers that pre-lock tiles, pre-fill an address
  // (payment protocol, deep links), pay FIO requests, or take over the
  // broadcast/completion flow keep today's behavior untouched.
  const swapSendAllowed =
    lockTilesMap.address !== true &&
    lockTilesMap.amount !== true &&
    lockTilesMap.wallet !== true &&
    hiddenFeaturesMap.address !== true &&
    hiddenFeaturesMap.amount !== true &&
    fioPendingRequest == null &&
    onDone == null &&
    alternateBroadcast == null &&
    beforeTransaction == null &&
    initSpendInfo?.spendTargets[0]?.publicAddress == null

  // Where the funds land. The recipient asset defaults to the source asset;
  // `destChain` carries Houdini's metadata (address regex, memoNeeded) for
  // the destination chain when it is served.
  const destPluginId = recipientPluginId ?? pluginId
  // The payout is always the destination chain's NATIVE asset (the quote asks
  // for `toTokenId: null`), so a token source is never the same asset as its
  // destination even on its own chain.
  const sameAsset = destPluginId === pluginId && tokenId == null
  /**
   * A recipient asset was explicitly adopted. This is what turns a plain send
   * into a swap-send on its own, and it is also the test for whether turning
   * Stealth off would help: without an adopted recipient, the toggle is the
   * only thing making this a swap, so switching it off degrades to a plain
   * same-chain send.
   */
  const crossAssetPicked = recipientPluginId != null && !sameAsset
  /**
   * Whether the swap crosses assets, for labelling the flow. Distinct from
   * `crossAssetPicked`: a token send to its own chain pays out that chain's
   * native asset, so it is a cross-asset swap even though no recipient asset
   * was picked. Treating it as same-asset titled it "Stealth Send".
   */
  const crossAsset = !sameAsset
  const swapSendActive = swapSendAllowed && (stealth || crossAssetPicked)
  /**
   * The asset the recipient ends up with, which the "Recipient receives" row
   * and its picker both name. A swap-send pays out the destination chain's
   * native asset; a plain send delivers the source asset, token and all.
   */
  const recipientAsset = getRecipientAsset({
    sourcePluginId: pluginId,
    sourceTokenId: tokenId,
    destPluginId,
    swapSendActive
  })
  const destChain = swapSendActive
    ? getHoudiniChain(destPluginId, null)
    : undefined
  const destCurrencyConfig = account.currencyConfig[destPluginId]
  const destCurrencyInfo = destCurrencyConfig?.currencyInfo
  const destExchangeDenom =
    destCurrencyConfig == null
      ? undefined
      : getExchangeDenom(destCurrencyConfig, null)
  // Called unconditionally to keep hook order stable; the value is only read
  // once a destination chain is actually selected. Limits are quoted in the
  // denomination the user reads elsewhere, not the exchange one.
  const destDisplayDenom = useDisplayDenom(
    destCurrencyConfig ?? coreWallet.currencyConfig,
    null
  )

  /**
   * Whether Houdini can route the source asset to ITSELF privately, which is
   * what a same-asset Stealth Send asks for. Read off the chain table rather
   * than learned from a quote, since it is a property of the asset.
   */
  const selfPrivateAvailable =
    getHoudiniChain(pluginId, tokenId)?.hasSelfPrivate === true

  /**
   * The order size in USD, the unit Houdini states its minimums in. Priced off
   * whichever side the user fixed, so it matches the number they typed.
   * `undefined` when no rate is known, which stands the floor check down rather
   * than blocking a send on a missing rate.
   */
  const orderUsdValue = React.useMemo<string | undefined>(() => {
    const useSendSide = guaranteedSide === 'send'
    const nativeAmount = useSendSide
      ? spendInfo.spendTargets[0].nativeAmount
      : receiveNativeAmount
    const multiplier = useSendSide
      ? cryptoExchangeDenomination.multiplier
      : destExchangeDenom?.multiplier
    if (
      nativeAmount == null ||
      zeroString(nativeAmount) ||
      multiplier == null
    ) {
      return undefined
    }
    const usdValue = convertCurrency(
      exchangeRates,
      useSendSide ? pluginId : destPluginId,
      useSendSide ? tokenId : null,
      'iso:USD',
      div(nativeAmount, multiplier, DECIMAL_PRECISION)
    )
    return zeroString(usdValue) ? undefined : usdValue
  }, [
    cryptoExchangeDenomination.multiplier,
    destExchangeDenom?.multiplier,
    destPluginId,
    exchangeRates,
    guaranteedSide,
    pluginId,
    receiveNativeAmount,
    spendInfo,
    tokenId
  ])

  /**
   * Whether the order clears Houdini's minimum for the route it would take.
   * Private routes start at 25 USD and standard ones at 10, so a Stealth Send
   * is pre-empted well before a plain Swap & Send is. Both are checked before
   * any request goes out: the provider is an aggregator that rate-limits tight
   * traffic, so a quote we already know will be refused is not worth sending.
   */
  const belowPrivateFloor =
    orderUsdValue != null && lt(orderUsdValue, HOUDINI_MIN_USD.private)
  const belowStandardFloor =
    orderUsdValue != null && lt(orderUsdValue, HOUDINI_MIN_USD.standard)

  /**
   * A provider floor, stated in USD, rendered in the user's own display fiat.
   *
   * The floors are USD because that is the unit Houdini enforces them in, but
   * the user reads every other amount on this scene in their display currency,
   * so writing the raw figure with a dollar sign is wrong twice for anyone not
   * on USD: the wrong symbol, and a number that is not the threshold in their
   * currency. Converted through the same rates the rest of the scene uses and
   * formatted by the same helper, so it reads like every other fiat figure.
   *
   * With no rate between USD and the display fiat there is nothing honest to
   * convert to, so the USD figure is shown carrying its OWN symbol rather than
   * a wrong number wearing the user's.
   */
  const formatUsdFloor = (usdFloor: string): string => {
    const rate = getFiatRate(exchangeRates, 'iso:USD', defaultIsoFiat)
    const isoFiat = rate === 0 ? 'iso:USD' : defaultIsoFiat
    const amount = rate === 0 ? usdFloor : mul(usdFloor, String(rate))
    return `${getFiatSymbol(isoFiat)}${formatFiatString({
      fiatAmount: amount
    })}`
  }

  // The PIN spending limit gates every outbound flow, swap-send included.
  // DERIVED, not effect-written: it used to be state refreshed inside the
  // makeSpend effect, which runs AFTER the render that already holds a live
  // quote, so a frame could show an armed slider while the flag still read
  // false. Computing it during render makes the gate and the amount it judges
  // come from the same render.
  const spendingLimitExceeded = React.useMemo<boolean>(() => {
    if (!pinSpendingLimitsEnabled) return false
    const rate =
      getExchangeRate(
        exchangeRates,
        coreWallet.currencyInfo.pluginId,
        tokenId,
        defaultIsoFiat
      ) ?? INFINITY_STRING
    const totalNativeAmount = spendInfo.spendTargets.reduce(
      (prev, target) => add(target.nativeAmount ?? '0', prev),
      '0'
    )
    const totalExchangeAmount = div(
      totalNativeAmount,
      cryptoExchangeDenomination.multiplier,
      DECIMAL_PRECISION
    )
    const fiatAmount = mul(totalExchangeAmount, rate)
    return gte(fiatAmount, pinSpendingLimitsAmount.toFixed(DECIMAL_PRECISION))
  }, [
    coreWallet.currencyInfo.pluginId,
    cryptoExchangeDenomination.multiplier,
    defaultIsoFiat,
    exchangeRates,
    pinSpendingLimitsAmount,
    pinSpendingLimitsEnabled,
    spendInfo,
    tokenId
  ])

  // A raw swap failure renders as ErrorCard's catch-all "unexpected error"
  // card, which tells the user nothing they can act on. Map it to the same
  // specific text the wallet-to-wallet swap flow shows: the limit that was
  // crossed and by how much, the pair that cannot route, or, failing a known
  // shape, the provider's own message.
  const describeSwapError = (error: unknown): unknown => {
    const info = processSwapQuoteError({
      error,
      swapRequest: {
        fromWallet: coreWallet,
        fromTokenId: tokenId,
        toTokenId: null,
        toAddressInfo: {
          toPluginId: destPluginId,
          toAddress: spendInfo.spendTargets[0].publicAddress ?? '',
          toMemos: []
        },
        nativeAmount: spendInfo.spendTargets[0].nativeAmount ?? '0',
        quoteFor: guaranteedSide === 'send' ? 'from' : 'to'
      },
      fromDenomination: cryptoDisplayDenomination,
      toDenomination: destDisplayDenom,
      toCurrencyCode: destCurrencyInfo?.currencyCode
    })
    return info == null ? error : new I18nError(info.title, info.message)
  }
  const multipleTargets = spendInfo.spendTargets.length > 1

  // What the provider is known to offer for the current pair. `false` means a
  // live quote already came back without that capability this session;
  // `undefined` means untested, so the UI assumes available until told
  // otherwise.
  const routePairKey = `${pluginId}:${String(tokenId)}->${destPluginId}`
  // `fixedTo` is a property of the ROUTE, not of the pair. Houdini prices
  // exact-out on fixed-rate quotes alone, which its private routing does not
  // serve, so a receive-priced failure learned with privacy required says
  // nothing about the standard route the same pair takes with Stealth off, and
  // vice versa. Sharing one key let a failure on either side refuse the editor
  // on the other, for a capability that was never tested there.
  const routeCapKeys = {
    stealth: routePairKey,
    fixedTo: `${routePairKey}:${stealth ? 'private' : 'any'}`
  }
  const pairCaps = {
    stealth: routeCaps[routeCapKeys.stealth]?.stealth,
    fixedTo: routeCaps[routeCapKeys.fixedTo]?.fixedTo
  }
  const markRouteCap = (cap: 'stealth' | 'fixedTo'): void => {
    const key = routeCapKeys[cap]
    setRouteCaps(caps => ({
      ...caps,
      [key]: { ...caps[key], [cap]: false }
    }))
  }

  /**
   * Why the Stealth toggle cannot be armed right now, or `undefined` when it
   * can. Ordered most specific first, so the user reads the reason that
   * applies to the send in front of them rather than the first one that fires.
   */
  const stealthBlockedReason: string | undefined = multipleTargets
    ? lstrings.stealth_multi_recipient_unsupported
    : sameAsset && !selfPrivateAvailable
    ? sprintf(lstrings.stealth_self_private_unsupported_1s, currencyCode)
    : belowPrivateFloor
    ? sprintf(
        lstrings.stealth_below_private_minimum_1s,
        formatUsdFloor(HOUDINI_MIN_USD.private)
      )
    : pairCaps.stealth === false
    ? lstrings.stealth_route_unavailable_info
    : undefined

  /** The floor this send must clear for the route it would actually take. */
  const belowActiveFloor = stealth ? belowPrivateFloor : belowStandardFloor

  const updatePendingTxState = React.useCallback(async (): Promise<void> => {
    if (coreWallet == null || !isEvmWallet(coreWallet)) {
      setHasPendingTx(false)
      return
    }

    try {
      const transactions = await coreWallet.getTransactions({ tokenId })
      const hasPending = transactions.some(tx => {
        if (tx.tokenId !== tokenId) return false
        if (!tx.isSend) return false
        if (
          tx.confirmations === 'unconfirmed' ||
          (typeof tx.confirmations === 'number' && tx.confirmations === 0)
        ) {
          return true
        }
        return false
      })
      setHasPendingTx(hasPending)
    } catch (err: unknown) {
      console.warn('Error checking for pending transactions:', err)
      setHasPendingTx(false)
    }
  }, [coreWallet, tokenId])

  React.useEffect(() => {
    if (coreWallet == null || !isEvmWallet(coreWallet)) {
      setHasPendingTx(false)
      return
    }

    let isMounted = true

    const handleTxUpdate = (txs: EdgeTransaction[]): void => {
      if (!isMounted) return
      if (isSendingRef.current) return

      let relevantPending = false
      for (const tx of txs) {
        if (tx.tokenId !== tokenId) continue
        if (!tx.isSend) continue
        if (
          tx.confirmations === 'unconfirmed' ||
          (typeof tx.confirmations === 'number' && tx.confirmations === 0)
        ) {
          relevantPending = true
          break
        }
      }

      if (relevantPending) {
        setHasPendingTx(true)
      } else {
        updatePendingTxState().catch((err: unknown) => {
          console.warn('Error refreshing pending transaction state:', err)
        })
      }
    }

    updatePendingTxState().catch((err: unknown) => {
      console.warn('Error initializing pending transaction state:', err)
    })

    const cleanupNew = coreWallet.on('newTransactions', handleTxUpdate)
    const cleanupChanged = coreWallet.on('transactionsChanged', handleTxUpdate)
    const cleanupRemoved = coreWallet.on('transactionsRemoved', () => {
      updatePendingTxState().catch((err: unknown) => {
        console.warn('Error refreshing pending transaction state:', err)
      })
    })

    return () => {
      isMounted = false
      cleanupNew()
      cleanupChanged()
      cleanupRemoved()
    }
  }, [coreWallet, tokenId, updatePendingTxState])

  if (initialMount.current) {
    if (hiddenFeaturesMap.scamWarning === false) {
      showSendScamWarningModal(account.disklet).catch((err: unknown) => {
        showError(err)
      })
    }
    initialMount.current = false
  }

  const pendingInsufficientFees = React.useRef<
    InsufficientFundsError | undefined
  >(undefined)

  async function showInsufficientFees(
    error: InsufficientFundsError
  ): Promise<void> {
    await showInsufficientFeesModal({
      coreError: error,
      countryCode,
      navigation: navigation as NavigationBase,
      wallet: coreWallet
    })
  }

  /**
   * Sets the destination tag for a user- or URI-driven change, retiring any
   * held quote when the value actually moves.
   *
   * The tag rides `toAddressInfo.toMemos` into the quote request, so it is one
   * of the terms the order was created against, exactly like the amount and the
   * address. Leaving a quote armed across a tag change lets a slide submit the
   * memo the order was built with while the screen shows a different one, which
   * on a memo-required payout is the difference between the recipient being
   * credited and not.
   */
  const changeDestinationTag = (tag: string | undefined): void => {
    setDestinationTag(previous => {
      if (previous !== tag) setSwapQuote(undefined)
      return tag
    })
  }

  const handleChangeAddress =
    (spendTarget: EdgeSpendTarget) =>
    async (changeAddressResult: ChangeAddressResult): Promise<void> => {
      const {
        addressEntryMethod,
        parsedUri,
        fioAddress,
        alias,
        resolvedName,
        crossChainDisplayAmount,
        crossChainMemo,
        detectedDestPluginId
      } = changeAddressResult

      // A destination detected from the address itself makes this a cross-asset
      // send. `setRecipientPluginId` has not re-rendered yet, so the routing
      // below reads the detected chain rather than the stale render-time state.
      const uriGuaranteesReceiveSide =
        detectedDestPluginId != null || (swapSendActive && !sameAsset)
      const uriDestExchangeDenom =
        detectedDestPluginId == null
          ? destExchangeDenom
          : getExchangeDenom(account.currencyConfig[detectedDestPluginId], null)

      if (parsedUri != null) {
        // The recipient is one of the terms a quote was priced against, so a
        // new address retires it exactly as a new amount, wallet or toggle
        // does. Dropping the quote rather than only re-requesting one matters
        // because the slider gates on a quote being PRESENT: leaving the old
        // one up keeps the slider armed, and a slide during the re-quote would
        // approve an order created for the address the user just replaced.
        if (spendTarget.publicAddress !== parsedUri.publicAddress) {
          setSwapQuote(undefined)
        }
        // A scanned code's tag reaches the row here too, not only through the
        // detect-and-adopt path: picking the recipient asset BEFORE scanning is
        // the ordinary order, and the tag credits the recipient either way.
        //
        // Gated on the destination needing a memo, exactly as the adopt path
        // is. The Destination Tag row only renders for a `memoNeeded` chain, so
        // taking a BIP-21 `message` on any other chain would ride a value into
        // `toMemos` that the user can neither see nor clear.
        const memoDestChain =
          detectedDestPluginId == null
            ? destChain
            : getHoudiniChain(detectedDestPluginId, null)
        if (
          memoDestChain?.memoNeeded === true &&
          crossChainMemo != null &&
          crossChainMemo !== ''
        ) {
          changeDestinationTag(crossChainMemo)
        }
        if (parsedUri.metadata != null) {
          spendInfo.metadata = parsedUri.metadata
        }
        spendTarget.uniqueIdentifier = parsedUri?.uniqueIdentifier
        spendTarget.publicAddress = parsedUri?.publicAddress

        if (uriGuaranteesReceiveSide) {
          // A payment URI's amount is what the recipient should receive, so a
          // cross-asset send guarantees the destination side and prices the
          // send side off the quote. A cross-chain URI carries display units
          // to convert; a same-chain one is already destination-native.
          //
          // Same-asset (stealth) sends stay on the send side: guaranteeing the
          // receive side needs a receive-priced quote, and the provider offers
          // no fixed-rate route when the source and destination assets match.
          const uriReceiveNativeAmount =
            crossChainDisplayAmount != null && uriDestExchangeDenom != null
              ? mul(crossChainDisplayAmount, uriDestExchangeDenom.multiplier)
              : parsedUri.nativeAmount
          spendTarget.nativeAmount = undefined
          if (uriReceiveNativeAmount != null) {
            setReceiveNativeAmount(uriReceiveNativeAmount)
            setGuaranteedSide('receive')
          }
        } else {
          spendTarget.nativeAmount = parsedUri.nativeAmount
        }

        const memos: EdgeMemo[] = []
        // Preserve existing memo data or use memo/uniqueIdentifier from parsed URI
        if (parsedUri.uniqueIdentifier != null) {
          spendTarget.memo = parsedUri.uniqueIdentifier
          memos.push(createEdgeMemo(memoOptions, parsedUri.uniqueIdentifier))
        }

        if (
          spendInfo.spendTargets.length > 2 &&
          spendTarget.nativeAmount == null
        ) {
          // Check if the last two spend targets have the same amount within 0.5%
          const prevAmount =
            spendInfo.spendTargets[spendInfo.spendTargets.length - 2]
              .nativeAmount
          const pprevAmount =
            spendInfo.spendTargets[spendInfo.spendTargets.length - 3]
              .nativeAmount

          if (prevAmount != null && pprevAmount != null) {
            const diff = abs(sub(prevAmount, pprevAmount))
            const diffPercent = div(diff, prevAmount, DECIMAL_PRECISION)
            if (lte(diffPercent, MULTI_OUT_DIFF_PERCENT)) {
              spendTarget.nativeAmount = prevAmount
            }
          }
        }
        spendTarget.otherParams = {
          fioAddress,
          zanoAlias: alias,
          resolvedName
        }

        // We can assume the spendTarget object came from the Component spendInfo so simply resetting the spendInfo
        // should properly re-render with new spendTargets
        setLastAddressEntryMethod(addressEntryMethod)
        setMinNativeAmount(parsedUri.minNativeAmount)
        setExpireDate(parsedUri?.expireDate)
        setAddressExpired(false)
        setSpendInfo({ ...spendInfo, memos })
        needsScrollToEnd.current = true
      }
    }

  /**
   * Rescues input the sending wallet could not parse. An address for another
   * chain is the ordinary way a user asks for a cross-chain send: they paste
   * the recipient's address before touching "Recipient receives". Detect the
   * chain it belongs to, adopt it as the destination, and keep the address.
   *
   * Returns false to let the tile report an invalid address, which is still
   * the right answer for a genuine typo.
   */
  /**
   * Adopt a destination on another chain: the recipient asset becomes that
   * chain, any tag and quote held for the previous one is dropped, and the
   * address lands in the tile. Shared by address detection, which infers the
   * chain from the text, and the "Myself" picker, which knows it outright.
   */
  const adoptCrossChainDestination =
    (spendTarget: EdgeSpendTarget) =>
    async (
      destPluginId: string,
      publicAddress: string,
      addressEntryMethod: AddressEntryMethod,
      crossChainDisplayAmount?: string,
      /**
       * A destination memo the new destination arrived with, from a scanned
       * URI. Passed in rather than written by the caller beforehand, because
       * the reset below clears the tag and would drop it.
       */
      crossChainMemo?: string
    ): Promise<void> => {
      setRecipientPluginId(destPluginId)
      // A new destination chain invalidates any tag and quote held for the old
      // one, exactly as picking the recipient asset by hand does. A memo that
      // came WITH the new destination survives, since it describes this
      // destination rather than the one being left:
      setDestinationTag(crossChainMemo)
      setSwapQuote(undefined)
      setReceiveNativeAmount(undefined)
      setGuaranteedSide('send')
      setFixedToFallback(false)

      await handleChangeAddress(spendTarget)({
        parsedUri: { publicAddress },
        addressEntryMethod,
        crossChainDisplayAmount,
        detectedDestPluginId: destPluginId
      })
    }

  /**
   * The recipient assets the "Myself" picker may offer: the source asset plus
   * every chain the provider pays out to. Derived from the route metadata, so
   * a chain added there shows up here with no further change. Tokens are
   * absent only because `getHoudiniChain` returns undefined for a non-null
   * tokenId; when token routes appear they flow through unchanged.
   */
  const selfTransferAssets = React.useMemo<EdgeAsset[] | undefined>(() => {
    if (!swapSendAllowed || multipleTargets) return undefined
    const assets: EdgeAsset[] = [{ pluginId, tokenId }]
    for (const chain of HOUDINI_CHAINS) {
      if (chain.pluginId === pluginId) continue
      if (account.currencyConfig[chain.pluginId] == null) continue
      assets.push({ pluginId: chain.pluginId, tokenId: null })
    }
    return assets
  }, [account, multipleTargets, pluginId, swapSendAllowed, tokenId])

  /**
   * Which of the three send-shaped swap flows this scene just ran. Stealth is
   * the toggle; cross-asset is the destination asset differing from the
   * source.
   */
  const swapSendType: EdgeTxActionSwapType = stealth
    ? crossAsset
      ? 'stealthSwapSend'
      : 'stealthSend'
    : 'swapSend'

  /**
   * Record the flow on the broadcast transaction's saved action, preserving
   * everything the swap plugin already wrote. A failure here costs the
   * transaction its title, never the transaction, so it is logged and
   * swallowed rather than surfaced over a completed send.
   */
  const stampSwapSendAction = async (tx: EdgeTransaction): Promise<void> => {
    const { savedAction } = tx
    if (savedAction == null || savedAction.actionType !== 'swap') return
    const stamped = { ...savedAction, swapType: swapSendType }
    // The success scene, and the details scene behind it, render this object
    // rather than re-reading the wallet, so it carries the flow too.
    tx.savedAction = stamped
    try {
      // A token send files a second action for its parent-currency fee, built
      // from the plugin's own unstamped copy, so that row has no `swapType`
      // and no flow identity. Stamping it is best effort, like the stamp
      // beside it: the recipient's privacy on that row does NOT rest on this
      // call landing, because the details scene suppresses a payout address on
      // any network-fee row regardless. What a failure here costs is the row's
      // title, not the recipient.
      //
      // The two writes are independent rows, so they go out together rather
      // than one after the other, which held the success scene for two round
      // trips on every token send.
      await Promise.all([
        coreWallet.saveTxAction({
          txid: tx.txid,
          tokenId,
          assetAction: tx.assetAction ?? { assetActionType: 'swap' },
          savedAction: stamped
        }),
        ...(hasParentFeeRow(tx)
          ? [
              coreWallet.saveTxAction({
                txid: tx.txid,
                tokenId: null,
                assetAction: { assetActionType: 'swapNetworkFee' },
                savedAction: stamped
              })
            ]
          : [])
      ])
    } catch (error: unknown) {
      console.warn('Could not save the swap-send action type', String(error))
    }
  }

  const handleSelfTransferAsset =
    (spendTarget: EdgeSpendTarget) =>
    async (destPluginId: string, address: string): Promise<boolean> => {
      await adoptCrossChainDestination(spendTarget)(
        destPluginId,
        address,
        'other'
      )
      return true
    }

  const handleUnparsedAddress =
    (spendTarget: EdgeSpendTarget) =>
    async (
      address: string,
      addressEntryMethod: AddressEntryMethod
    ): Promise<boolean> => {
      if (!swapSendAllowed || multipleTargets) return false

      const candidates = detectHoudiniChains(address, {
        sourcePluginId: pluginId,
        sourceTokenId: tokenId,
        isSupported: id => account.currencyConfig[id] != null
      })
      if (candidates.length === 0) return false

      // An address format shared by several chains (any EVM `0x…`) cannot be
      // resolved from the address alone, and guessing would send the funds to
      // the wrong network, so the user names the network.
      let chain = candidates[0]
      if (candidates.length > 1) {
        const displayNameToChain = new Map<string, HoudiniChain>()
        const items = candidates.map(candidate => {
          const { currencyCode: chainCode, displayName } =
            account.currencyConfig[candidate.pluginId].currencyInfo
          displayNameToChain.set(displayName, candidate)
          return {
            name: displayName,
            text: chainCode,
            icon: (
              <CryptoIcon
                pluginId={candidate.pluginId}
                tokenId={null}
                sizeRem={1.5}
              />
            )
          }
        })
        const selected = await Airship.show<string | undefined>(bridge => (
          <RadioListModal
            bridge={bridge}
            title={lstrings.stealth_detected_network_title}
            message={sprintf(
              lstrings.stealth_detected_network_message,
              currencyCode
            )}
            items={items}
          />
        ))
        const picked =
          selected == null ? undefined : displayNameToChain.get(selected)
        // Dismissing the picker is a deliberate cancel, not a bad address.
        if (picked == null) return true
        chain = picked
      }

      const { addressCandidates, displayAmount, memo } =
        parsePaymentUri(address)
      const publicAddress = addressCandidates.find(candidate =>
        isValidHoudiniAddress(chain, candidate)
      )
      if (publicAddress == null) return false

      // A scanned exchange deposit code carries the tag that credits the
      // recipient. Adopting the address and dropping the tag pays the exchange
      // with nothing to attribute it to, which is a loss the user cannot see.
      const crossChainMemo =
        chain.memoNeeded && memo != null && memo !== '' ? memo : undefined

      await adoptCrossChainDestination(spendTarget)(
        chain.pluginId,
        publicAddress,
        addressEntryMethod,
        displayAmount,
        crossChainMemo
      )
      return true
    }

  const handleAddressAmountPress = (index: number) => (): void => {
    // This is deleting the combo address/amount tile. If this happens, remove the
    // lastAddressEntryMethod so we don't auto launch the camera again.
    setLastAddressEntryMethod(undefined)
    spendInfo.spendTargets.splice(index, 1)
    setSpendInfo({ ...spendInfo })
    needsScrollToEnd.current = true
  }

  const renderAddressAmountTile = (
    index: number,
    spendTarget: EdgeSpendTarget
  ): React.ReactElement => {
    const { publicAddress, nativeAmount, otherParams = {} } = spendTarget
    const { fioAddress, resolvedName } = otherParams
    let title = ''
    if (fioAddress != null) {
      title = `Send To (${fioAddress}) ${publicAddress}`
    } else if (resolvedName != null) {
      title = `Send To (${resolvedName.name}) ${publicAddress}`
    } else {
      title = `Send To ${publicAddress}`
    }
    return (
      <EditableAmountTile
        title={title}
        exchangeRates={exchangeRates}
        nativeAmount={nativeAmount ?? ''}
        pluginId={pluginId}
        tokenId={tokenId}
        exchangeDenomination={cryptoExchangeDenomination}
        displayDenomination={cryptoDisplayDenomination}
        lockInputs={lockTilesMap.amount ?? false}
        compressed
        // TODO: Handle press
        onPress={handleAddressAmountPress(index)}
      />
    )
  }

  const handleResetSendTransaction = (spendTarget: EdgeSpendTarget) => () => {
    spendTarget.otherParams = undefined
    spendTarget.publicAddress = undefined
    spendTarget.nativeAmount = undefined
    spendTarget.memo = spendTarget.uniqueIdentifier = undefined
    // Through the owners, not `setError` directly: a bare clear leaves
    // `swapErrorShown` believing a swap error is still on screen, and the next
    // plain-send failure then cannot retract itself.
    //
    // The expiry flag is lowered BEFORE the retraction, not after: the
    // retraction reads that flag and declines while it is raised, so clearing
    // in the other order leaves the expiry card on screen over an address the
    // user just removed, with the slider re-enabled beneath it.
    clearSwapError()
    setAddressExpired(false)
    clearPlainSendError()
    setExpireDate(undefined)
    setPinValue(undefined)
    setFixedToFallback(false)
    // Clearing the address ends the swap-send: leaving the destination chain,
    // tag, receive amount or standing quote behind means the next address
    // entered gets quoted against the previous recipient's state.
    setSwapQuote(undefined)
    setReceiveNativeAmount(undefined)
    setGuaranteedSide('send')
    setRecipientPluginId(undefined)
    setDestinationTag(undefined)
    setSpendInfo({ ...spendInfo })
    // This is deleting the amount tile. If this happens, remove the
    // lastAddressEntryMethod so we don't auto launch the camera again.
    setLastAddressEntryMethod(undefined)
  }

  const renderAddressTile = (
    index: number,
    spendTarget: EdgeSpendTarget
  ): React.ReactElement | null => {
    if (coreWallet != null && hiddenFeaturesMap.address !== true) {
      // TODO: Change API of AddressTile to access undefined recipientAddress
      const { publicAddress = '', otherParams = {} } = spendTarget
      const { fioAddress, zanoAlias, resolvedName } = otherParams
      const recipientName = fioAddress ?? resolvedName?.name ?? zanoAlias
      // Only the name-service path carries an inline service badge — FIO and
      // Zano handles render plain.
      const recipientNameService =
        recipientName != null && recipientName === resolvedName?.name
          ? resolvedName.service
          : null
      const title =
        lstrings.send_scene_send_to_address +
        (spendInfo.spendTargets.length > 1 ? ` ${(index + 1).toString()}` : '')
      const doOpenCamera =
        openCameraRef.current ||
        (publicAddress === '' && lastAddressEntryMethod === 'scan')
      if (openCameraRef.current) openCameraRef.current = false

      // A cross-chain destination address cannot be parsed by the source
      // wallet; validate it against the destination chain's own rules:
      const crossChainAddressValidation =
        swapSendActive && destPluginId !== pluginId
          ? (
              address: string,
              uri: { scheme?: string; evmChainId?: string }
            ) => {
              if (destChain == null) return false
              // What the code says about its own chain wins over the fact that
              // the address happens to validate here. Refusing hands the input
              // to `onUnparsedAddress`, which adopts the chain the code names;
              // accepting would pay whichever chain was already picked and read
              // the URI's amount in that chain's asset.
              //
              // The chain id is checked first and on its own: every EVM network
              // writes `ethereum:`, so on that family the scheme agrees with a
              // picked Polygon destination while the id is the only thing that
              // disagrees.
              if (
                uri.evmChainId != null &&
                Number(uri.evmChainId) !== destChain.evmChainId
              ) {
                return false
              }
              if (
                uri.scheme != null &&
                uri.evmChainId == null &&
                !schemeNamesChain(uri.scheme, destChain)
              ) {
                return false
              }
              return isValidHoudiniAddress(destChain, address)
            }
          : undefined

      return (
        <AddressTile2
          title={title}
          recipientAddress={publicAddress}
          coreWallet={coreWallet}
          tokenId={tokenId}
          onChangeAddress={handleChangeAddress(spendTarget)}
          resetSendTransaction={handleResetSendTransaction(spendTarget)}
          lockInputs={lockTilesMap.address}
          isCameraOpen={doOpenCamera}
          recipientName={recipientName}
          recipientNameService={recipientNameService}
          crossChainAddressValidation={crossChainAddressValidation}
          onUnparsedAddress={handleUnparsedAddress(spendTarget)}
          selfTransfer={
            selfTransferAssets == null
              ? undefined
              : {
                  allowedAssets: selfTransferAssets,
                  onPickCrossAsset: handleSelfTransferAsset(spendTarget)
                }
          }
          navigation={navigation as NavigationBase}
        />
      )
    }

    return null
  }

  const handleAmountsChanged =
    (spendTarget: EdgeSpendTarget) =>
    (amounts: ExchangedFlipInputAmounts): void => {
      const { nativeAmount, fieldChanged: newField } = amounts
      spendTarget.nativeAmount = nativeAmount === '' ? undefined : nativeAmount

      // This works since the spendTarget object is guaranteed to be inside
      // the spendInfo object
      setProcessingAmountChanged(true)
      setSpendInfo({ ...spendInfo })
      setMaxSpendSetter(-1)
      setFieldChanged(newField)
      needsScrollToEnd.current = true
    }

  const handleFeesChange = useHandler((): void => {
    if (coreWallet == null) return

    navigation.navigate('changeMiningFee2', {
      spendInfo,
      maxSpendSet: maxSpendSetter >= 0,
      tokenId,
      walletId: coreWallet.id,
      onSubmit: (networkFeeOption, customNetworkFee) => {
        setSpendInfo({ ...spendInfo, networkFeeOption, customNetworkFee })
        setPinValue(undefined)
      }
    })
  })

  const handleFlipInputModal =
    (index: number, spendTarget: EdgeSpendTarget) => (): void => {
      const { noChangeMiningFee } = getSpecialCurrencyInfo(pluginId)
      Airship.show<FlipInputModalResult>(bridge => (
        <FlipInputModal2
          ref={flipInputModalRef}
          bridge={bridge}
          startNativeAmount={spendTarget.nativeAmount}
          feeTokenId={null}
          forceField={fieldChanged}
          onAmountsChanged={handleAmountsChanged(spendTarget)}
          onMaxSet={() => {
            setMaxSpendSetter(index)
          }}
          onFeesChange={
            noChangeMiningFee === true ? undefined : handleFeesChange
          }
          wallet={coreWallet}
          tokenId={tokenId}
          feeNativeAmount={feeNativeAmount}
        />
      ))
        .catch((error: unknown) => {
          showError(error)
        })
        .finally(() => {
          const insufficientFunds = pendingInsufficientFees.current
          if (insufficientFunds != null) {
            pendingInsufficientFees.current = undefined
            showInsufficientFees(insufficientFunds).catch((error: unknown) => {
              showError(error)
            })
          }
        })
    }

  const renderAmount = (
    index: number,
    spendTarget: EdgeSpendTarget
  ): React.ReactElement | null => {
    // A send-to-address swap renders its own linked amount rows:
    if (swapSendActive) return null
    const { publicAddress, nativeAmount } = spendTarget
    if (publicAddress != null && hiddenFeaturesMap.amount !== true) {
      const title =
        lstrings.fio_request_amount +
        (spendInfo.spendTargets.length > 1 ? ` ${(index + 1).toString()}` : '')
      return (
        <EditableAmountTile
          title={title}
          exchangeRates={exchangeRates}
          nativeAmount={nativeAmount ?? ''}
          pluginId={pluginId}
          tokenId={tokenId}
          exchangeDenomination={cryptoExchangeDenomination}
          displayDenomination={cryptoDisplayDenomination}
          lockInputs={lockTilesMap.amount ?? false}
          // TODO: Handle press
          onPress={handleFlipInputModal(index, spendTarget)}
        />
      )
    }

    return null
  }

  const renderAddressAmountPairs = (): Array<React.ReactElement | null> => {
    const out: Array<React.ReactElement | null> = []
    for (let i = 0; i < spendInfo.spendTargets.length; i++) {
      const spendTarget = spendInfo.spendTargets[i]
      let element: React.ReactElement | null
      if (i < spendInfo.spendTargets.length - 1) {
        element = renderAddressAmountTile(i, spendTarget)
        if (element != null) out.push(element)
      } else {
        element = renderAddressTile(i, spendTarget)
        if (element != null) out.push(element)
        element = renderAmount(i, spendTarget)
        if (element != null) out.push(element)
      }
    }
    return out
  }

  const handleWalletPress = useHandler((): void => {
    Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        headerTitle={lstrings.fio_src_wallet}
        navigation={navigation as NavigationBase}
      />
    ))
      .then(result => {
        if (result?.type !== 'wallet') {
          return
        }
        const walletChanged = result.walletId !== walletId
        setWalletId(result.walletId)
        const { pluginId: newPluginId } =
          currencyWallets[result.walletId].currencyInfo
        const assetChanged =
          pluginId !== newPluginId || tokenId !== result.tokenId
        if (assetChanged) {
          setTokenId(result.tokenId)
        }
        // A new source WALLET invalidates the swap-send destination state, not
        // just a new source asset: a held quote carries an order created for
        // the old wallet's refund address, so approving it after a switch would
        // spend from one wallet against another wallet's order. Switching
        // between two wallets on the same asset is the case that used to slip
        // through. The fixed-to warning, the Stealth toggle and the learned
        // route capabilities go too: all describe the pair and wallet the user
        // just left, so carrying them over produces auto-disables and errors
        // the user cannot connect to anything they did.
        if (walletChanged || assetChanged) {
          setRecipientPluginId(undefined)
          setDestinationTag(undefined)
          setSwapQuote(undefined)
          setReceiveNativeAmount(undefined)
          setGuaranteedSide('send')
          setFixedToFallback(false)
          setRateStarvedFallback(false)
          setStealth(false)
          setRouteCaps({})
          // The message describes the pair and wallet the user just left, the
          // same reason the toggle and the route caps go. Through the owners,
          // so `swapErrorShown` does not survive the wallet it belonged to.
          clearSwapError()
          setAddressExpired(false)
          clearPlainSendError()
          // The recipients go with them whenever the new wallet could not pay
          // them: a foreign-chain destination adopted for a swap-send, or a
          // different asset. Clearing the destination CHAIN while leaving such
          // an address behind drops the scene back into plain-send mode still
          // displaying an address the new source wallet cannot pay, one slide
          // from a send that can only fail. A plain switch between two wallets
          // on the SAME asset is the case that must NOT clear: that address is
          // still payable, and wiping it only makes the user type it again.
          // Written once, as the whole spend: a second `setSpendInfo` here
          // would close over the pre-reset value and put the old targets back.
          if (assetChanged || recipientPluginId != null) {
            setSpendInfo({
              tokenId: assetChanged ? result.tokenId : tokenId,
              spendTargets: [{}],
              memos: []
            })
          }
        }
      })
      .catch((error: unknown) => {
        showError(error)
        console.error(error)
      })
  })

  const renderSelectedWallet = (): React.ReactElement => {
    const name = coreWallet == null ? '' : getWalletName(coreWallet)

    return (
      <EdgeRow
        rightButtonType={lockTilesMap.wallet === true ? 'none' : 'editable'}
        title={lstrings.send_scene_send_from_wallet}
        onPress={lockTilesMap.wallet === true ? undefined : handleWalletPress}
        body={`${name} (${currencyCode})`}
      />
    )
  }

  const handleAddAddress = useHandler((): void => {
    spendInfo.spendTargets.push({})
    setSpendInfo({ ...spendInfo })
    needsScrollToEnd.current = true
  })

  // ---------------------------------------------------------------------
  // Send-to-address swap handlers + rows
  // ---------------------------------------------------------------------

  const handleToggleStealth = useHandler((): void => {
    if (multipleTargets) return
    // No private route is possible for this asset, pair, or amount: refuse to
    // arm and say why, instead of arming a toggle whose quote is guaranteed to
    // fail. Turning it back OFF is always allowed.
    if (!stealth && stealthBlockedReason != null) {
      showToast(stealthBlockedReason)
      return
    }
    // The standing quote was priced under the OTHER privacy setting, so it is
    // dead the moment the toggle moves. Drop it here rather than relying on
    // the re-quote effect to disable the slider a render later: the whole
    // point of the toggle is that a private send is never approved against a
    // transparent route, and the reverse.
    setSwapQuote(undefined)
    setStealth(value => !value)
    setPinValue(undefined)
  })

  const handlePickRecipientAsset = useHandler((): void => {
    if (multipleTargets) return
    // Rows are keyed on the ASSET, never on its label: several chains share a
    // currency code (ETH on Base / Arbitrum / Ethereum) and a token can share
    // both name and code with a chain (the POL ERC-20 and Polygon), so a
    // label-keyed list marks the wrong rows selected and resolves either tap
    // to the same destination.
    const keyToRecipientPluginId = new Map<string, string | undefined>()
    const items = getRecipientAssetChoices({
      sourcePluginId: pluginId,
      sourceTokenId: tokenId,
      swapSendActive,
      servedPluginIds: HOUDINI_CHAINS.filter(
        chain => account.currencyConfig[chain.pluginId] != null
      ).map(chain => chain.pluginId)
    }).flatMap(choice => {
      const described = describeAsset(account, choice.asset)
      if (described == null) return []
      const value = recipientAssetKey(choice.asset)
      keyToRecipientPluginId.set(value, choice.recipientPluginId)
      return [
        {
          value,
          name: described.displayName,
          text: described.currencyCode,
          icon: (
            <CryptoIcon
              pluginId={choice.asset.pluginId}
              tokenId={choice.asset.tokenId}
              sizeRem={1.5}
            />
          )
        }
      ]
    })

    Airship.show<string | undefined>(bridge => (
      <RadioListModal
        bridge={bridge}
        title={lstrings.stealth_recipient_receives}
        searchPlaceholder={lstrings.search_assets}
        selected={recipientAssetKey(recipientAsset)}
        items={items}
      />
    ))
      .then(selected => {
        if (selected == null || !keyToRecipientPluginId.has(selected)) return
        const nextPluginId = keyToRecipientPluginId.get(selected)
        if (nextPluginId === recipientPluginId) return
        // A new destination chain invalidates the entered address and tag, so
        // clear the whole recipient first. The reset drops the destination
        // chain too, which is why the new one is applied AFTER it: setting it
        // first would leave the reset's undefined as the last write.
        handleResetSendTransaction(spendInfo.spendTargets[0])()
        setRecipientPluginId(nextPluginId)
      })
      .catch((error: unknown) => {
        showError(error)
      })
  })

  // Swap-send amounts are entered through the standard crypto/fiat flip
  // input. The modal resolves its final amounts on close; an untouched or
  // zero amount is a dismissal, matching the old text-modal semantics, so
  // quotes still fire on commit rather than per keystroke. Max is hidden
  // because max spend is not offered in swap-send mode.
  //
  // Both sides open on fiat, which is what the Exchange scene's amount entry
  // and the plain send's already do. It is also the denomination the decision
  // is made in here: the provider states its floors in USD, and the two sides
  // of a cross-asset send have no common crypto unit to compare in.
  const handleEditYouSend = useHandler((): void => {
    Airship.show<FlipInputModalResult>(bridge => (
      <FlipInputModal2
        bridge={bridge}
        wallet={coreWallet}
        tokenId={tokenId}
        startNativeAmount={spendInfo.spendTargets[0].nativeAmount}
        forceField="fiat"
        feeTokenId={null}
        headerText={lstrings.stealth_you_send}
        hideMaxButton
      />
    ))
      .then(({ nativeAmount }) => {
        if (zeroString(nativeAmount)) return
        spendInfo.spendTargets[0].nativeAmount = nativeAmount
        // The standing quote priced the previous amount, so it is dead the
        // moment a new one commits. Drop it here rather than leaving it up
        // until the refetch lands, which would keep the slider armed against
        // an amount the user just replaced.
        setSwapQuote(undefined)
        setGuaranteedSide('send')
        setFixedToFallback(false)
        setSpendInfo({ ...spendInfo })
      })
      .catch((error: unknown) => {
        showError(error)
      })
  })

  // The destination is an address, not a wallet, so the flip input borrows
  // the user's own wallet on the destination chain for denominations and
  // rates. Without one, a plain text modal is the fallback.
  const destFlipWallet = Object.values(currencyWallets).find(
    wallet => wallet.currencyInfo.pluginId === destPluginId
  )

  const handleEditRecipientGets = useHandler((): void => {
    if (destExchangeDenom == null) return
    // The pair is known to have no receive-priced route, so an exact receive
    // amount cannot be honored. Explain rather than opening an editor whose
    // value would immediately bounce back to the send side.
    if (pairCaps.fixedTo === false) {
      showToast(lstrings.stealth_fixed_to_unavailable_toast)
      return
    }
    if (destFlipWallet != null) {
      Airship.show<FlipInputModalResult>(bridge => (
        <FlipInputModal2
          bridge={bridge}
          wallet={destFlipWallet}
          tokenId={null}
          startNativeAmount={receiveNativeAmount}
          forceField="fiat"
          feeTokenId={null}
          headerText={lstrings.stealth_recipient_gets}
          hideMaxButton
        />
      ))
        .then(({ nativeAmount }) => {
          if (zeroString(nativeAmount)) return
          setReceiveNativeAmount(nativeAmount)
          setSwapQuote(undefined)
          setGuaranteedSide('receive')
          setFixedToFallback(false)
        })
        .catch((error: unknown) => {
          showError(error)
        })
      return
    }
    const startAmount =
      receiveNativeAmount == null || zeroString(receiveNativeAmount)
        ? ''
        : div(
            receiveNativeAmount,
            destExchangeDenom.multiplier,
            DECIMAL_PRECISION
          )
    Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        title={lstrings.stealth_recipient_gets}
        inputLabel={destCurrencyInfo?.currencyCode ?? ''}
        keyboardType="decimal-pad"
        initialValue={startAmount}
      />
    ))
      .then(amount => {
        if (amount == null || amount === '') return
        setReceiveNativeAmount(mul(amount, destExchangeDenom.multiplier))
        setSwapQuote(undefined)
        setGuaranteedSide('receive')
        setFixedToFallback(false)
      })
      .catch((error: unknown) => {
        showError(error)
      })
  })

  const handleEditDestinationTag = useHandler((): void => {
    Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        title={lstrings.memo_destination_tag_title}
        inputLabel={lstrings.memo_destination_tag_label}
        initialValue={destinationTag ?? ''}
        maxLength={64}
      />
    ))
      .then(tag => {
        if (tag == null) return
        changeDestinationTag(tag === '' ? undefined : tag.trim())
      })
      .catch((error: unknown) => {
        showError(error)
      })
  })

  const handleSwapQuoteExpired = useHandler((): void => {
    // Drop the quote, do not just ask for a new one. Bumping the nonce alone
    // left the expired quote in state until the effect got around to running,
    // and the slider gates on `swapQuote != null`, so there was a window where
    // a slide would approve an order the provider had already retired.
    setSwapQuote(undefined)
    setSwapQuoteNonce(nonce => nonce + 1)
  })

  /**
   * One side of the linked flip inputs. The edited side is the guaranteed
   * amount; the other tracks the live quote as an estimate. The state word
   * rides in the row's own header, tinted, so the amount below it reads as a
   * single uninterrupted line.
   */
  const renderSwapAmountRow = (
    title: string,
    displayAmount: string,
    displayCode: string,
    isGuaranteed: boolean,
    onPress: () => void,
    fiat: SwapRowFiat | undefined
  ): React.ReactElement => (
    <EdgeRow
      rightButtonType="editable"
      title={title}
      titleState={
        isGuaranteed ? (
          <PositiveText>{`(${lstrings.stealth_guaranteed})`}</PositiveText>
        ) : (
          <WarningText>{`(${lstrings.stealth_estimated})`}</WarningText>
        )
      }
      onPress={onPress}
    >
      <EdgeText style={styles.swapAmountText}>
        {`${isGuaranteed ? '' : '~ '}${displayAmount} ${displayCode}`}
        {fiat == null ? null : (
          <>
            {' ('}
            <FiatText
              nativeCryptoAmount={fiat.nativeAmount}
              tokenId={fiat.tokenId}
              currencyConfig={fiat.currencyConfig}
            />
            )
          </>
        )}
      </EdgeText>
    </EdgeRow>
  )

  /**
   * What one side of the swap needs for its inline fiat value, or `undefined`
   * when there is no amount to convert. `FiatText` owns the formatting, so the
   * parenthesised `1.23 LTC ($45.67)` shape matches the rest of the app.
   */
  const swapRowFiat = (
    nativeAmount: string | undefined,
    rowCurrencyConfig: EdgeCurrencyConfig | undefined,
    rowTokenId: EdgeTokenId
  ): SwapRowFiat | undefined => {
    if (
      nativeAmount == null ||
      zeroString(nativeAmount) ||
      rowCurrencyConfig == null
    ) {
      return undefined
    }
    return {
      nativeAmount,
      tokenId: rowTokenId,
      currencyConfig: rowCurrencyConfig
    }
  }

  const renderYouSendRow = (): React.ReactElement => {
    const nativeAmount = spendInfo.spendTargets[0].nativeAmount
    const displayAmount = zeroString(nativeAmount)
      ? '0'
      : div(
          nativeAmount ?? '0',
          cryptoDisplayDenomination.multiplier,
          DECIMAL_PRECISION
        )
    return renderSwapAmountRow(
      lstrings.stealth_you_send,
      displayAmount,
      currencyCode,
      guaranteedSide === 'send',
      handleEditYouSend,
      swapRowFiat(nativeAmount, coreWallet.currencyConfig, tokenId)
    )
  }

  const renderRecipientGetsRow = (): React.ReactElement | null => {
    if (destExchangeDenom == null) return null
    const displayAmount =
      receiveNativeAmount == null || zeroString(receiveNativeAmount)
        ? '0'
        : div(
            receiveNativeAmount,
            destExchangeDenom.multiplier,
            DECIMAL_PRECISION
          )
    return renderSwapAmountRow(
      lstrings.stealth_recipient_gets,
      displayAmount,
      destCurrencyInfo?.currencyCode ?? '',
      guaranteedSide === 'receive',
      handleEditRecipientGets,
      swapRowFiat(receiveNativeAmount, destCurrencyConfig, null)
    )
  }

  const renderRecipientReceives = (): React.ReactElement | null => {
    if (!swapSendAllowed) return null
    const described = describeAsset(account, recipientAsset)
    const recipientCurrencyCode = described?.currencyCode ?? currencyCode
    const recipientDisplayName = described?.displayName ?? recipientCurrencyCode
    return (
      <EdgeRow
        rightButtonType={multipleTargets ? 'none' : 'editable'}
        title={lstrings.stealth_recipient_receives}
        onPress={multipleTargets ? undefined : handlePickRecipientAsset}
      >
        <View style={styles.swapAssetRow}>
          <CryptoIcon
            pluginId={recipientAsset.pluginId}
            tokenId={recipientAsset.tokenId}
            sizeRem={1.5}
            marginRem={[0, 0.5, 0, 0]}
          />
          <EdgeText>{`${recipientDisplayName} (${recipientCurrencyCode})`}</EdgeText>
        </View>
      </EdgeRow>
    )
  }

  const renderDestinationTagRow = (): React.ReactElement | null => {
    if (destChain?.memoNeeded !== true) return null
    return (
      <EdgeRow
        rightButtonType="editable"
        title={lstrings.memo_destination_tag_title}
        onPress={handleEditDestinationTag}
      >
        <EdgeText>{destinationTag ?? ''}</EdgeText>
      </EdgeRow>
    )
  }

  const renderSwapQuoteRow = (): React.ReactElement | null => {
    if (spendInfo.spendTargets[0].publicAddress == null) return null
    if (fetchingSwapQuote) {
      return (
        <EdgeRow title={lstrings.stealth_quote_rate}>
          <View style={styles.calcFeeView}>
            <EdgeText>{lstrings.stealth_getting_quote}</EdgeText>
            <ActivityIndicator style={styles.calcFeeSpinner} />
          </View>
        </EdgeRow>
      )
    }
    if (swapQuote == null) return null

    // Rate in exchange (standard) units, plus the provider that quoted and
    // the shared price-delta indicator:
    const fromExchangeAmount = div(
      swapQuote.fromNativeAmount,
      cryptoExchangeDenomination.multiplier,
      DECIMAL_PRECISION
    )
    const toExchangeAmount =
      destExchangeDenom == null
        ? '0'
        : div(
            swapQuote.toNativeAmount,
            destExchangeDenom.multiplier,
            DECIMAL_PRECISION
          )
    const rate = zeroString(fromExchangeAmount)
      ? '0'
      : div(toExchangeAmount, fromExchangeAmount, 8)
    const providerName =
      account.swapConfig[swapQuote.pluginId]?.swapInfo.displayName ??
      swapQuote.pluginId
    const priceImpact = calculateQuotePriceImpact(
      swapQuote,
      exchangeRates,
      defaultIsoFiat
    )

    return (
      <>
        <EdgeRow title={lstrings.stealth_quote_rate}>
          <View style={styles.swapAmountRow}>
            <EdgeText style={styles.swapAmountText}>
              {`1 ${currencyCode} = ${rate} ${
                destCurrencyInfo?.currencyCode ?? ''
              }`}
              <PriceImpactText priceImpact={priceImpact} />
            </EdgeText>
            <EdgeText style={styles.providerHint}>{providerName}</EdgeText>
          </View>
        </EdgeRow>
        {swapQuote.expirationDate == null ? null : (
          <CountdownTile
            title={lstrings.stealth_quote_expires}
            isoExpireDate={swapQuote.expirationDate.toISOString()}
            onDone={handleSwapQuoteExpired}
            maximumHeight="small"
          />
        )}
      </>
    )
  }

  const renderSwapFeeRow = (): React.ReactElement | null => {
    if (swapQuote == null) return null
    const { networkFee } = swapQuote
    const feeDenom = getExchangeDenom(
      coreWallet.currencyConfig,
      networkFee.tokenId
    )
    const feeDisplayAmount = div(
      networkFee.nativeAmount,
      feeDenom.multiplier,
      DECIMAL_PRECISION
    )
    return (
      <EdgeRow title={`${lstrings.wc_smartcontract_network_fee}:`}>
        <EdgeText>{`${feeDisplayAmount} ${feeDenom.name}`}</EdgeText>
      </EdgeRow>
    )
  }

  const renderStealthToggle = (): React.ReactElement | null => {
    if (!swapSendAllowed) return null
    return (
      <EdgeAnim enter={{ type: 'fadeInDown', distance: 40 }}>
        <EdgeCard sections>
          <SettingsSwitchRow
            label={lstrings.stealth_send_toggle}
            value={stealth}
            disabled={multipleTargets}
            onPress={handleToggleStealth}
          />
          {stealthBlockedReason != null && !stealth ? (
            <StealthInfoText message={stealthBlockedReason} />
          ) : stealth ? (
            <StealthInfoText
              message={lstrings.stealth_send_info}
              showLearnMore
            />
          ) : null}
        </EdgeCard>
      </EdgeAnim>
    )
  }

  /**
   * With multiple recipients, show the aggregate on one row instead of making
   * the reviewer sum the per-recipient amounts.
   */
  const renderMultiRecipientTotal = (): React.ReactElement | null => {
    if (!multipleTargets) return null
    const totalNativeAmount = spendInfo.spendTargets.reduce(
      (prev, target) => add(target.nativeAmount ?? '0', prev),
      '0'
    )
    const totalDisplayAmount = div(
      totalNativeAmount,
      cryptoDisplayDenomination.multiplier,
      DECIMAL_PRECISION
    )
    return (
      <EdgeRow title={lstrings.string_total_amount}>
        <EdgeText>{`${totalDisplayAmount} ${currencyCode}`}</EdgeText>
      </EdgeRow>
    )
  }

  const renderAddAddress = (): React.ReactElement | null => {
    // Stealth and cross-asset sends support exactly one recipient:
    if (swapSendActive) return null
    const { pluginId } = coreWallet.currencyInfo
    const maxSpendTargets =
      getSpecialCurrencyInfo(pluginId)?.maxSpendTargets ?? 1
    if (
      maxSpendTargets < 2 ||
      hiddenFeaturesMap.address === true ||
      hiddenFeaturesMap.amount === true ||
      lockTilesMap.address === true ||
      lockTilesMap.amount === true
    ) {
      return null
    }
    const numTargets = spendInfo.spendTargets.length
    const lastTargetHasAddress =
      spendInfo.spendTargets[numTargets - 1].publicAddress != null &&
      spendInfo.spendTargets[numTargets - 1].publicAddress !== ''
    const lastTargetHasAmount =
      spendInfo.spendTargets[numTargets - 1].nativeAmount != null
    if (lastTargetHasAddress && lastTargetHasAmount && ALLOW_MULTIPLE_TARGETS) {
      return (
        <EdgeRow
          rightButtonType="touchable"
          title={lstrings.send_add_another_address}
          onPress={handleAddAddress}
          maximumHeight="small"
        />
      )
    } else {
      return null
    }
  }

  const handleTimeoutDone = useHandler((): void => {
    if (onExpired != null) {
      // Caller provided custom expiry handler - call it without showing error
      onExpired()
    } else {
      // The flag, not just the card. The card lives in the shared `error`
      // state, which entering swap-send legitimately clears, so on its own it
      // let an expired payment request end up behind a live swap quote with the
      // slider still armed. Expiry is a property of the REQUEST, so it outlives
      // whichever send mode the scene is in and is cleared only by replacing
      // the address.
      setAddressExpired(true)
      setError(
        new I18nError(
          lstrings.transaction_failure,
          lstrings.send_address_expired_error_message
        )
      )
    }
  })

  const renderTimeout = (): React.ReactElement | null => {
    if (expireDate == null) return null

    return (
      <CountdownTile
        title={lstrings.send_address_expire_title}
        isoExpireDate={expireDate.toISOString()}
        onDone={handleTimeoutDone}
        maximumHeight="small"
      />
    )
  }

  const renderError = (): React.ReactElement | null => {
    if (error != null && asMaybeNoAmountSpecifiedError(error) == null) {
      return <ErrorCard error={error} />
    }
    return null
  }

  const renderFees = (): React.ReactElement | null => {
    if (swapSendActive) return null
    if (
      spendInfo.spendTargets[0].publicAddress != null &&
      spendInfo.spendTargets[0].nativeAmount != null
    ) {
      const { noChangeMiningFee } = getSpecialCurrencyInfo(pluginId)
      let feeDisplayDenomination: EdgeDenomination
      let feeExchangeDenomination: EdgeDenomination

      let fiatAmount = '0'
      let feeSyntax = ` 0 (${fiatAmount})`
      let feeSyntaxStyle: string | undefined
      if (edgeTransaction?.parentNetworkFee != null) {
        feeDisplayDenomination = parentDisplayDenom
        feeExchangeDenomination = parentExchangeDenom
      } else {
        feeDisplayDenomination = cryptoDisplayDenomination
        feeExchangeDenomination = cryptoExchangeDenomination
      }

      if (edgeTransaction != null) {
        const transactionFee = convertTransactionFeeToDisplayFee(
          coreWallet.currencyInfo.pluginId,
          null,
          defaultIsoFiat,
          exchangeRates,
          edgeTransaction,
          feeDisplayDenomination,
          feeExchangeDenomination
        )

        fiatAmount = ` ${transactionFee.fiatAmount}`
        const cryptoPart =
          transactionFee.cryptoSymbol != null
            ? `${transactionFee.cryptoSymbol} ${transactionFee.cryptoAmount}`
            : `${transactionFee.cryptoAmount} ${
                transactionFee.currencyName ?? ''
              }`
        feeSyntax = `${cryptoPart} (${transactionFee.fiatSymbol}${fiatAmount})`
        feeSyntaxStyle = transactionFee.fiatStyle
      }

      return (
        <EdgeRow
          rightButtonType={
            noChangeMiningFee === true || lockTilesMap.fee === true
              ? 'none'
              : 'touchable'
          }
          title={`${lstrings.wc_smartcontract_network_fee}:`}
          onPress={noChangeMiningFee === true ? undefined : handleFeesChange}
        >
          {processingAmountChanged ? (
            <View style={styles.calcFeeView}>
              <EdgeText
                style={{
                  color:
                    feeSyntaxStyle != null
                      ? // @ts-expect-error Provide theme key mapping
                        theme[feeSyntaxStyle]
                      : theme.primaryText
                }}
              >
                {lstrings.send_confirmation_calculating_fee}
              </EdgeText>

              <ActivityIndicator style={styles.calcFeeSpinner} />
            </View>
          ) : (
            <EdgeText
              style={{
                color:
                  feeSyntaxStyle != null
                    ? // @ts-expect-error Provide theme key mapping
                      theme[feeSyntaxStyle]
                    : theme.primaryText
              }}
            >
              {feeSyntax}
            </EdgeText>
          )}
        </EdgeRow>
      )
    }

    return null
  }

  const renderMetadataNotes = (): React.ReactElement | null => {
    const notes = edgeTransaction?.metadata?.notes
    if (notes != null) {
      return (
        <EdgeRow title={lstrings.send_scene_metadata_name_title}>
          <EdgeText>{notes}</EdgeText>
        </EdgeRow>
      )
    }
    return null
  }

  const handleFioAddressSelect = useHandler(
    (
      fioAddress: string,
      fioWallet: EdgeCurrencyWallet,
      fioError: string
    ): void => {
      setFioSender({
        ...fioSender,
        fioAddress,
        fioWallet,
        fioError
      })
    }
  )

  const handleMemoChange = useHandler(
    (memo: string, memoError: string): void => {
      setFioSender({
        ...fioSender,
        memo,
        memoError
      })
    }
  )

  const renderSelectFioAddress = (): React.ReactElement | null => {
    if (hiddenFeaturesMap.fioAddressSelect === true) return null
    const fioTarget = spendInfo.spendTargets.some(
      target => target.otherParams?.fioAddress != null
    )

    // HACK: CardUi4 somehow recognizes SelectFioAddress2 as a valid element
    // even when that component is returning null. Return null here instead so
    // the card can be properly hidden.
    if (fioPendingRequest == null && !fioTarget) return null

    return (
      <SendFromFioRows
        navigation={navigation}
        selected={fioSender.fioAddress}
        memo={fioSender.memo}
        memoError={fioSender.memoError}
        onSelect={handleFioAddressSelect}
        onMemoChange={handleMemoChange}
        coreWallet={coreWallet}
        currencyCode={currencyCode}
        fioRequest={fioPendingRequest}
        isSendUsingFioAddress={fioTarget}
      />
    )
  }

  const renderMemoOptions = (): Array<React.ReactElement | null> => {
    // A send-to-address swap's deposit memo comes from the provider, and the
    // recipient's tag is entered on the destination-tag row instead:
    if (swapSendActive) return [null]
    const spendTarget: EdgeSpendTarget | undefined = spendInfo.spendTargets[0]
    if (spendTarget?.publicAddress == null) return [null]

    const renderOption = (
      memoOption: EdgeMemoOption,
      value: string = '',
      isLegacy: boolean = false
    ): React.ReactElement | null => {
      const memoLabel = getMemoLabel(memoOption.memoName)
      const memoTitle = getMemoTitle(memoOption.memoName)
      const addButtonText = sprintf(lstrings.memo_dropdown_option_s, memoLabel)

      let maxLength: number | undefined
      if (memoOption.type === 'text') {
        maxLength = memoOption.maxLength
      } else if (memoOption.type === 'number') {
        maxLength = memoOption.maxValue?.length
      } else if (memoOption.type === 'hex' && memoOption.maxBytes != null) {
        maxLength = 2 * memoOption.maxBytes
      }

      const handleMemo = async (): Promise<void> => {
        await Airship.show<string | undefined>(bridge => (
          <TextInputModal
            bridge={bridge}
            initialValue={value}
            inputLabel={memoTitle}
            keyboardType={memoOption.type === 'number' ? 'numeric' : 'default'}
            maxLength={maxLength}
            message={sprintf(
              lstrings.unique_identifier_modal_description,
              memoLabel
            )}
            submitLabel={lstrings.unique_identifier_modal_confirm}
            title={memoTitle}
            onSubmit={async value => {
              if (value === '') return true
              return (
                getMemoError(
                  {
                    type: memoOption.type,
                    memoName: memoOption.memoName,
                    value
                  },
                  memoOption
                ) ?? true
              )
            }}
          />
        ))
          .then(newValue => {
            if (newValue == null) return

            // If user submitted an empty string, clear the memo
            if (newValue === '') {
              if (spendInfo.memos != null) {
                const index = spendInfo.memos.findIndex(
                  memo => memo.type === memoOption.type
                )
                if (index >= 0) spendInfo.memos.splice(index, 1)
              }
              // If this option represents the legacy unique identifier, clear those too
              if (isLegacy) {
                spendTarget.memo = undefined
                spendTarget.uniqueIdentifier = undefined
              }
              setSpendInfo({ ...spendInfo })
              return
            }

            spendInfo.memos ??= []

            const edgeMemo: EdgeMemo = {
              type: memoOption.type,
              memoName: memoOption.memoName,
              value: newValue
            }

            const spendInfoMemoIndex = spendInfo.memos.findIndex(
              memo => memo.type === memoOption.type
            )
            if (spendInfoMemoIndex === -1) {
              spendInfo.memos.push(edgeMemo)
            } else {
              spendInfo.memos[spendInfoMemoIndex] = edgeMemo
            }
            setSpendInfo({ ...spendInfo })
          })
          .catch((e: unknown) => {
            showError(e)
          })
      }

      return (
        <EdgeRow
          rightButtonType="touchable"
          title={memoTitle}
          onPress={handleMemo}
        >
          <EdgeText>{value ?? addButtonText}</EdgeText>
        </EdgeRow>
      )
    }

    let legacyUniqueIdentifier = getLegacyUniqueIdentifier(spendTarget)

    const rows: Array<React.ReactElement | null> = []
    for (const option of memoOptions) {
      if (option.hidden === true) continue

      if (legacyUniqueIdentifier != null) {
        rows.push(renderOption(option, legacyUniqueIdentifier, true))
        legacyUniqueIdentifier = undefined
      } else {
        const memoValue =
          spendInfo?.memos?.find(memo => memo.type === option.type)?.value ?? ''
        rows.push(renderOption(option, memoValue, false))
      }
    }
    return rows
  }

  const handleFocusPin = useHandler((): void => {
    pinInputRef.current?.focus()
  })

  const handleChangePin = useHandler((pin: string): void => {
    setPinValue(pin)
    if (pin.length >= PIN_MAX_LENGTH && pinInputRef.current?.blur != null) {
      pinInputRef.current.blur()
    }
  })

  const renderInfoTiles = (): Array<React.ReactElement | null> | null => {
    if (infoTiles == null || infoTiles.length === 0) return null
    return infoTiles.map(({ label, value, maximumHeight }) => (
      <EdgeRow
        key={label}
        title={label}
        body={value}
        maximumHeight={maximumHeight}
      />
    ))
  }

  const renderAuthentication = (): React.ReactElement | null => {
    if (!pinSpendingLimitsEnabled) return null
    if (!spendingLimitExceeded) return null

    const pinLength = pinValue?.length ?? 0
    return (
      <EdgeRow
        rightButtonType="touchable"
        title={lstrings.four_digit_pin}
        onPress={handleFocusPin}
      >
        <View style={styles.pinContainer}>
          <PinDots pinLength={pinLength} maxLength={PIN_MAX_LENGTH} />
        </View>
        <UnscaledTextInput
          ref={pinInputRef}
          maxLength={PIN_MAX_LENGTH}
          onChangeText={handleChangePin}
          keyboardType="numeric"
          returnKeyType="done"
          placeholder={lstrings.spending_limits_enter_pin}
          placeholderTextColor={theme.textLink}
          style={styles.pinInput}
          value={pinValue}
          secureTextEntry
        />
      </EdgeRow>
    )
  }

  const renderScamWarning = (): React.ReactElement | null => {
    const { publicAddress } = spendInfo.spendTargets[0]

    if (publicAddress === '' || publicAddress == null) {
      const scamMessage = sprintf(
        lstrings.warning_scam_message_financial_advice_s,
        config.appName
      )
      const scamFooter = sprintf(
        lstrings.warning_scam_footer_s,
        config.supportEmail
      )

      return (
        <AlertCardUi4
          marginRem={[1.5, 0.5]}
          title={lstrings.warning_scam_title}
          type="warning"
          body={[
            scamMessage,
            lstrings.warning_scam_message_irreversibility,
            lstrings.warning_scam_message_unknown_recipients
          ]}
          footer={scamFooter}
        />
      )
    }
    return null
  }

  const handleLearnMore = useHandler(async () => {
    const url =
      config.pendingTxLearnMoreUrl ??
      'https://support.edge.app/hc/en-us/articles/43465958781723'
    return await Linking.openURL(url).catch(() => {})
  })

  const renderPendingTransactionWarning = (): React.ReactElement | null => {
    if (!hasPendingTx) return null

    return (
      <EdgeAnim enter={{ type: 'fadeInUp', distance: 60 }}>
        <AlertCardUi4
          type="warning"
          title={lstrings.pending_transaction_modal_title}
          body={lstrings.pending_transaction_modal_message}
          button={{
            label: lstrings.learn_more_button,
            onPress: handleLearnMore
          }}
          marginRem={0.5}
        />
      </EdgeAnim>
    )
  }

  /**
   * A fixed receive amount (typed, or carried by a scanned payment URI) had
   * to fall back to a guaranteed SEND amount because the provider offers no
   * receive-priced route for this pair. Sits with the scene's other warning
   * cards and clears as soon as the user edits an amount.
   */
  const renderFixedToFallbackWarning = (): React.ReactElement | null => {
    if (!fixedToFallback || !swapSendActive) return null
    return (
      <EdgeAnim
        enter={{ type: 'fadeInUp', distance: 60 }}
        exit={{ type: 'fadeOutDown' }}
      >
        <AlertCardUi4
          type="warning"
          title={lstrings.stealth_fixed_to_fallback_title}
          body={lstrings.stealth_fixed_to_fallback_body}
          marginRem={0.5}
        />
      </EdgeAnim>
    )
  }

  const renderNymWarning = (): React.ReactElement | null => {
    if (!isNymActive || !processingAmountChanged) return null

    return (
      <EdgeAnim
        enter={{ type: 'fadeInUp', distance: 60 }}
        exit={{ type: 'fadeOutDown' }}
      >
        <AlertCardUi4
          type="warning"
          title={lstrings.settings_nym_mixnet_warning_title}
          body={lstrings.settings_nym_mixnet_warning_body}
          marginRem={0.5}
        />
      </EdgeAnim>
    )
  }

  const recordFioObtData = async (
    spendTarget: EdgeSpendTarget,
    currencyCode: string,
    txid: string
  ): Promise<void> => {
    if (fioSender == null) return
    const {
      fioAddress: payerFioAddress,
      fioWallet,
      memo,
      skipRecord = false
    } = fioSender
    if (skipRecord) return

    const {
      nativeAmount,
      publicAddress: payeePublicAddress = '',
      otherParams = {}
    } = spendTarget
    const { fioAddress: payeeFioAddress } = otherParams
    if (
      payeeFioAddress == null ||
      payerFioAddress == null ||
      fioWallet == null
    ) {
      return
    }

    if (fioPendingRequest != null) {
      try {
        await recordSend(fioWallet, fioSender.fioAddress, {
          fioRequestId: fioPendingRequest.fio_request_id,
          payeeFioAddress: fioPendingRequest.payee_fio_address,
          payerPublicAddress: fioPendingRequest.payer_fio_public_key,
          payeePublicAddress: fioPendingRequest.content.payee_public_address,
          amount: fioPendingRequest.content.amount,
          currencyCode: fioPendingRequest.content.token_code.toUpperCase(),
          chainCode: fioPendingRequest.content.chain_code.toUpperCase(),
          txid,
          memo: fioSender.memo
        })
      } catch (e: unknown) {
        const message = String(e)
        const isFeeExceeded = message.includes(
          FIO_FEE_EXCEEDS_SUPPLIED_MAXIMUM as string
        )
        if (isFeeExceeded) {
          showError(lstrings.fio_fee_exceeds_supplied_maximum_record_obt_data)
        } else {
          showError(e)
        }
      }
      return
    }

    await recordSend(fioWallet, payerFioAddress, {
      amount:
        nativeAmount != null
          ? div(
              nativeAmount,
              cryptoExchangeDenomination.multiplier,
              DECIMAL_PRECISION
            )
          : '0',
      chainCode: coreWallet.currencyInfo.currencyCode,
      currencyCode,
      memo,
      payeeFioAddress,
      payeePublicAddress,
      payerPublicAddress: fioWallet.publicWalletInfo.keys.publicKey,
      txid
    })
  }

  const handleSliderComplete = useHandler(
    async (resetSlider: () => void): Promise<void> => {
      // The PIN spending limit gates BOTH submit paths, so it is checked
      // before either one. It used to sit below the swap-send branch, which
      // returns early: a swap-send of any size skipped the PIN entirely.
      if (pinSpendingLimitsEnabled && spendingLimitExceeded) {
        const isAuthorized = await account.checkPin(pinValue ?? '')
        if (!isAuthorized) {
          resetSlider()
          setPinValue('')
          showToast(lstrings.incorrect_pin)
          return
        }
      }

      // A send-to-address swap submits by approving the live quote. The
      // slider is intentionally not reset on success, so a second slide
      // cannot fire while the scene transitions to the success scene.
      if (swapSendActive) {
        // A quote can be retired mid-slide, since the PIN check above awaits
        // and every term the quote was priced against retires it. The slider
        // latches its spinner until something resets it, so a slide that
        // arrives with no quote has to hand it back rather than just return.
        // An approval already in flight owns the slider and resets it itself.
        // The ref is what says whether the quote is still live: the closed-over
        // value is the one this slide started with, so approving it would sign
        // an order the scene retired while the PIN check was in flight.
        const liveQuote = swapQuoteRef.current
        if (liveQuote == null) {
          resetSlider()
          return
        }
        if (isApprovingSwapRef.current) return
        isApprovingSwapRef.current = true
        isSendingRef.current = true
        try {
          const result = await liveQuote.approve()
          // Name the flow on the saved action. Only this scene knows which of
          // the three send shapes ran: the plugin sees an ordinary swap, and
          // with every send-to-address quote restricted to the privacy
          // provider, the winning plugin cannot tell them apart either.
          await stampSwapSendAction(result.transaction)
          playSendSound().catch((error: unknown) => {
            console.log(error) // Fail quietly
          })
          // Delay navigation until gesture interactions finish to prevent
          // possible crashes, the same as the plain-send path below. The
          // slider stays latched either way, so the extra frame cannot let a
          // second slide through.
          InteractionManager.runAfterInteractions(() => {
            navigation.replace('swapSuccess', {
              edgeTransaction: result.transaction,
              walletId: coreWallet.id
            })
          })
        } catch (err: unknown) {
          setSwapError(describeSwapError(err))
          resetSlider()
        } finally {
          isApprovingSwapRef.current = false
          isSendingRef.current = false
        }
        return
      }

      if (edgeTransaction == null) return

      try {
        if (beforeTransaction != null) await beforeTransaction()
      } catch (e: unknown) {
        console.error(
          'Error from before transaction route param hook: ',
          String(e)
        )
        return
      }

      isSendingRef.current = true
      try {
        // Check the OBT data fee and error if we are sending to a FIO address but NOT if we are paying
        // a FIO request since we want to make sure that can go through.
        if (
          fioSender.fioWallet != null &&
          fioSender.fioAddress !== '' &&
          fioPendingRequest == null
        ) {
          await checkRecordSendFee(fioSender.fioWallet, fioSender.fioAddress)
        }

        const signedTx = await coreWallet.signTx(edgeTransaction)
        let broadcastedTx: EdgeTransaction
        if (alternateBroadcast != null) {
          broadcastedTx = await alternateBroadcast(signedTx)
        } else {
          broadcastedTx = await coreWallet.broadcastTx(signedTx)
        }

        // Figure out metadata (preserve Zano alias if provided)
        let payeeName: string | undefined
        const notes: string[] = []
        const payeeFioAddresses: string[] = []
        // Prefer explicit Zano alias if exactly one is present; otherwise fall back to default UI text
        if (coreWallet.currencyInfo.pluginId === 'zano') {
          const zanoAliases = spendInfo.spendTargets
            .map(t => t.otherParams?.zanoAlias)
            .filter((a): a is string => a != null && a.length > 0)
          if (zanoAliases.length === 1) {
            payeeName = zanoAliases[0]
          }
        }
        // Same idea for any name-service result (ENS / UD / ZNS) captured by
        // AddressTile2's forward or reverse lookup. The chain-specific Zcash
        // branch above is now subsumed by this generic check; ZNS results
        // flow through `resolvedName` like any other service.
        if (payeeName == null) {
          const resolvedNames = spendInfo.spendTargets
            .map(t => t.otherParams?.resolvedName?.name)
            .filter((n): n is string => n != null && n.length > 0)
          if (resolvedNames.length === 1) {
            payeeName = resolvedNames[0]
          }
        }
        for (const target of spendInfo.spendTargets) {
          const { fioAddress } = target.otherParams ?? {}
          if (fioAddress != null) {
            const displayAmount = div(
              target.nativeAmount ?? '',
              cryptoDisplayDenomination.multiplier,
              DECIMAL_PRECISION
            )
            const { name } = cryptoDisplayDenomination
            notes.push(`To ${fioAddress} <- ${displayAmount} ${name} \n`)
            payeeFioAddresses.push(fioAddress)
            if (payeeName == null) {
              payeeName = fioAddress
            } else {
              payeeName = `Multiple FIO Addresses (${notes.length.toString()})`
            }
          }
        }
        await addToFioAddressCache(account, payeeFioAddresses)

        broadcastedTx.metadata ??= {}
        if (
          payeeName != null &&
          // A stealth send must not put the recipient in the transaction
          // title, where it would sit in the list next to the amount. The
          // payout address is still stored on the swap data, so support can
          // trace a stuck order.
          !stealth &&
          (broadcastedTx.metadata?.name == null ||
            broadcastedTx.metadata.name === '')
        ) {
          broadcastedTx.metadata.name = payeeName
        }

        if (payeeName != null && fioSender != null) {
          let fioNotes = sprintf(
            `${lstrings.sent}\n`,
            `${lstrings.fragment_send_from_label.toLowerCase()} ${
              fioSender.fioAddress
            }`
          )
          fioNotes +=
            fioSender.memo != null && fioSender.memo !== ''
              ? `\n${lstrings.fio_sender_memo_label}: ${fioSender.memo}\n`
              : ''
          if (notes.length > 1) {
            fioNotes += notes.join('\n')
          }
          broadcastedTx.metadata.notes = `${fioNotes}\n${
            broadcastedTx.metadata?.notes ?? ''
          }`
        }

        const { name, type, id } = coreWallet
        const {
          currencyCode,
          nativeAmount,
          networkFee,
          parentNetworkFee,
          txid,
          ourReceiveAddresses,
          deviceDescription,
          networkFeeOption,
          requestedCustomFee,
          feeRateUsed
        } = signedTx

        logActivity(
          `broadcastTx: ${account.username} -- ${
            name ?? 'noname'
          } ${type} ${id}`
        )
        logActivity(`
  currencyCode: ${currencyCode}
  nativeAmount: ${nativeAmount}
  txid: ${txid}
  networkFee: ${networkFee}
  parentNetworkFee: ${parentNetworkFee ?? ''}
  deviceDescription: ${deviceDescription ?? ''}
  networkFeeOption: ${networkFeeOption ?? ''}
  requestedCustomFee: ${JSON.stringify(requestedCustomFee)}
  feeRateUsed: ${JSON.stringify(feeRateUsed)}
  spendTargets: ${JSON.stringify(spendInfo.spendTargets)}
  ourReceiveAddresses: ${JSON.stringify(ourReceiveAddresses)}`)

        await coreWallet.saveTx(broadcastedTx)

        // edge-core-js's saveTx silently drops tx.metadata when the engine
        // has already registered the txid in walletState before we get here
        // (race against the engine's onTransactionsChanged callback, which
        // calls setupNewTxMetadata with no metadata for the engine's view of
        // the tx). Re-apply via saveTxMetadata so payeeName and fio notes
        // survive a reload from disk.
        if (payeeName != null) {
          await coreWallet
            .saveTxMetadata({
              txid: broadcastedTx.txid,
              tokenId: broadcastedTx.tokenId,
              metadata: {
                name: broadcastedTx.metadata.name,
                notes: broadcastedTx.metadata.notes
              }
            })
            .catch((error: unknown) => {
              showError(error)
            })
        }

        for (const target of spendInfo.spendTargets) {
          // Write FIO OBT per spendTarget
          await recordFioObtData(
            target,
            currencyCode,
            broadcastedTx.txid
          ).catch((error: unknown) => {
            showError(error)
          })
        }

        playSendSound().catch((error: unknown) => {
          console.log(error) // Fail quietly
        })

        // Delay navigation until gesture interactions finish to prevent
        // possible crashes
        InteractionManager.runAfterInteractions(() => {
          if (onDone != null) {
            navigation.pop()
            const p = onDone(null, broadcastedTx)
            p?.catch((error: unknown) => {
              showError(error)
            })
          } else {
            navigation.replace('transactionDetails', {
              edgeTransaction: broadcastedTx,
              walletId: coreWallet.id
            })
          }
        })
        if (!dismissAlert) {
          Airship.show<'ok' | undefined>(bridge => (
            <ButtonsModal
              bridge={bridge}
              title={lstrings.transaction_success}
              message={lstrings.transaction_success_message}
              buttons={{
                ok: { label: lstrings.string_ok }
              }}
            />
          )).catch(() => {})
        }
      } catch (err: unknown) {
        console.log(err)
        const errorCasted = err instanceof Error ? err : new Error(String(err))
        let error = err

        if (errorCasted.name === 'ErrorAlgoRecipientNotActivated') {
          error = new I18nError(
            lstrings.send_confirmation_algo_recipient_not_activated_s,
            currencyCode
          )
        }
        if (errorCasted.name === 'ErrorEosInsufficientCpu') {
          error = new I18nError(
            lstrings.transaction_failure,
            lstrings.send_confirmation_eos_error_cpu
          )
        } else if (errorCasted.name === 'ErrorEosInsufficientNet') {
          error = new I18nError(
            lstrings.transaction_failure,
            lstrings.send_confirmation_eos_error_net
          )
        } else if (errorCasted.name === 'ErrorEosInsufficientRam') {
          error = new I18nError(
            lstrings.transaction_failure,
            lstrings.send_confirmation_eos_error_ram
          )
        } else if (
          errorCasted instanceof FioError &&
          errorCasted.code === FIO_NO_BUNDLED_ERR_CODE &&
          currencyCode !== FIO_STR
        ) {
          const answer = await Airship.show<'ok' | 'cancel' | undefined>(
            bridge => (
              <ButtonsModal
                bridge={bridge}
                title={lstrings.fio_no_bundled_err_msg}
                message={`${lstrings.fio_no_bundled_non_fio_err_msg} ${lstrings.fio_no_bundled_add_err_msg}`}
                buttons={{
                  ok: { label: lstrings.legacy_address_modal_continue },
                  cancel: { label: lstrings.string_cancel_cap }
                }}
              />
            )
          )
          if (answer === 'ok') {
            // Retry the spend w/o FIO OBT data
            fioSender.skipRecord = true
            await handleSliderComplete(resetSlider)
            return
          }
        } else if (errorCasted.message.includes('504')) {
          error = new I18nError(
            lstrings.transaction_failure,
            lstrings.transaction_failure_504_message
          )
        }

        setError(error)
      } finally {
        isSendingRef.current = false
        resetSlider()
      }
    }
  )

  // Mount/Unmount life-cycle events:
  useMount(() => {
    if (doCheckAndShowGetCryptoModal) {
      dispatch(
        checkAndShowGetCryptoModal(
          navigation as NavigationBase,
          coreWallet,
          tokenId
        )
      ).catch((err: unknown) => {
        showError(err)
      })
    }
  })
  useUnmount(() => {
    if (onBack != null) onBack()
  })

  // Calculate the transaction
  useAsyncEffect(
    async () => {
      // A send-to-address swap builds its transaction through the swap quote,
      // not through makeSpend:
      if (swapSendActive) {
        // Retire any plain makeSpend still in flight. Without this its success
        // handler lands after the switch and writes plain-send state (a fee, a
        // transaction, a cleared error) over a scene that is now quoting.
        makeSpendCounter.current++
        setEdgeTransaction(null)
        setProcessingAmountChanged(false)
        // Entering swap-send mode retracts the plain send's own error, the
        // mirror of what the quote effect does on the way out. An
        // insufficient-funds message from the direct send would otherwise sit
        // over a perfectly good swap quote. Only a plain-send error is cleared
        // here; a swap error belongs to the quote effect.
        clearPlainSendError()
        return
      }
      pendingInsufficientFees.current = undefined
      try {
        setProcessingAmountChanged(true)
        if (spendInfo.spendTargets[0].publicAddress == null) {
          setEdgeTransaction(null)
          setMaxSpendSetter(-1)
          setProcessingAmountChanged(false)
          return
        }
        if (maxSpendSetter === 0) {
          spendInfo.spendTargets[0].nativeAmount = '0' // Some currencies error without a nativeAmount
          const maxSpendable = await coreWallet.getMaxSpendable(spendInfo)
          spendInfo.spendTargets[0].nativeAmount = maxSpendable
        }
        if (spendInfo.spendTargets[0].nativeAmount == null) {
          flipInputModalRef.current?.setFees({
            feeNativeAmount: '',
            feeTokenId: null
          })
        }

        if (minNativeAmount != null) {
          for (const target of spendInfo.spendTargets) {
            if (target.nativeAmount == null) continue
            if (lt(target.nativeAmount, minNativeAmount)) {
              const minDisplayAmount = div(
                minNativeAmount,
                cryptoDisplayDenomination.multiplier,
                DECIMAL_PRECISION
              )
              const { name } = cryptoDisplayDenomination

              setError(
                new I18nError(
                  lstrings.transaction_failure,
                  sprintf(
                    lstrings.error_spend_amount_less_then_min_s,
                    `${minDisplayAmount} ${name}`
                  )
                )
              )
              setEdgeTransaction(null)
              setFeeNativeAmount('')
              setProcessingAmountChanged(false)
              return
            }
          }
        }

        makeSpendCounter.current++
        const localMakeSpendCounter = makeSpendCounter.current
        const edgeTx = await coreWallet.makeSpend(spendInfo)
        if (localMakeSpendCounter < makeSpendCounter.current) {
          // This makeSpend result is out of date. Throw it away since a newer one is in flight.
          // This is not REALLY needed since useAsyncEffect seems to serialize calls into the effect
          // function, but if this code ever gets refactored to not use useAsyncEffect, this
          // check MUST remain
          return
        }
        setEdgeTransaction(edgeTx)
        const { parentNetworkFee, networkFee } = edgeTx
        const feeNativeAmount = parentNetworkFee ?? networkFee
        const feeTokenId = parentNetworkFee == null ? tokenId : null
        setFeeNativeAmount(feeNativeAmount)
        flipInputModalRef.current?.setFees({ feeTokenId, feeNativeAmount })
        flipInputModalRef.current?.setError(null)
        // Only the plain send's own error: a swap error belongs to the quote
        // effect, and a makeSpend that succeeded says nothing about it.
        clearPlainSendError()
      } catch (err: unknown) {
        let error = err
        const insufficientFunds = asMaybeInsufficientFundsError(error)
        if (insufficientFunds != null) {
          const errorCurrencyCode = getCurrencyCode(
            coreWallet,
            insufficientFunds.tokenId
          )

          // Give extra information about the network name like Base or Arbitrum
          // where the mainnet token is ETH but the network is not Ethereum.
          if (
            errorCurrencyCode === 'ETH' &&
            coreWallet.currencyInfo.pluginId !== 'ethereum'
          ) {
            error = new I18nError(
              lstrings.transaction_failure,
              sprintf(
                lstrings.insufficient_funds_2s,
                errorCurrencyCode,
                coreWallet.currencyInfo.displayName
              )
            )
          } else {
            error = new I18nError(
              lstrings.transaction_failure,
              sprintf(lstrings.stake_error_insufficient_s, errorCurrencyCode)
            )
          }

          if (spendInfo.tokenId !== insufficientFunds.tokenId) {
            // Show the modal if the flip input modal is closed or save it to show when it closes later
            if (flipInputModalRef.current != null) {
              pendingInsufficientFees.current = insufficientFunds
            } else {
              await showInsufficientFees(insufficientFunds).catch(
                (error: unknown) => {
                  showError(error)
                }
              )
            }
          }
        }

        const isTxPending =
          error instanceof Error &&
          error.message === 'Unexpected pending transactions'

        // Only set hasPendingTx to true when pending tx error occurs;
        // don't clear it for other errors as it may have been legitimately
        // set by handleTxUpdate or updatePendingTxState
        if (isTxPending) {
          setHasPendingTx(true)
        }

        // Omit unexpected pending transactions error from being displayed,
        // because it is handled in real-time with a separate warning card
        setError(isTxPending ? undefined : error)

        setEdgeTransaction(null)

        const errorMessage =
          error instanceof Error ? error.message : String(error)
        flipInputModalRef.current?.setError(errorMessage)
        flipInputModalRef.current?.setFees({
          feeNativeAmount: '',
          feeTokenId: null
        })
      }
      setProcessingAmountChanged(false)
    },
    [
      spendInfo,
      maxSpendSetter,
      walletId,
      pinSpendingLimitsEnabled,
      pinValue,
      swapSendActive
    ],
    'SendComponent'
  )

  // Fetch the send-to-address swap quote. Quotes are requested when the
  // guaranteed-side amount commits (not per keystroke), and re-requested when
  // the destination, tag, or expiry nonce changes. Toggling stealth flips
  // `swapSendActive` on same-asset pairs; on cross-asset pairs the request is
  // identical either way, so the toggle alone never re-quotes.
  useAsyncEffect(
    async () => {
      // EVERY run of this effect retires any request still in flight from a
      // previous run, the early returns below included. Bumping only on the
      // paths that fetch let a request issued before the amount fell under the
      // floor land afterwards and re-arm the slider under it.
      const generation = ++swapQuoteGeneration.current

      if (!swapSendActive) {
        setSwapQuote(undefined)
        setFetchingSwapQuote(false)
        // Leaving swap-send mode retracts the swap's own error. Without this a
        // minimum-amount or unroutable-pair message from a cross-asset or
        // stealth attempt stayed on screen over the plain same-asset send the
        // user just switched to.
        clearSwapError()
        return
      }
      const toAddress = spendInfo.spendTargets[0].publicAddress
      const sendNativeAmount = spendInfo.spendTargets[0].nativeAmount
      const quoteNativeAmount =
        guaranteedSide === 'send' ? sendNativeAmount : receiveNativeAmount
      if (
        toAddress == null ||
        toAddress === '' ||
        quoteNativeAmount == null ||
        zeroString(quoteNativeAmount)
      ) {
        setSwapQuote(undefined)
        setFetchingSwapQuote(false)
        return
      }

      // Houdini refuses an order under its floor, so the refusal is spelled
      // out here instead of spent on a request. It also keeps a user tapping
      // through small amounts from burning the provider's rate limit, whose
      // 429s would come back looking like unavailable routes.
      if (belowActiveFloor) {
        setSwapQuote(undefined)
        setFetchingSwapQuote(false)
        setSwapError(
          new I18nError(
            lstrings.exchange_generic_error_title,
            sprintf(
              stealth
                ? lstrings.stealth_below_private_minimum_1s
                : lstrings.stealth_below_standard_minimum_1s,
              formatUsdFloor(
                stealth ? HOUDINI_MIN_USD.private : HOUDINI_MIN_USD.standard
              )
            )
          )
        )
        return
      }

      setFetchingSwapQuote(true)
      try {
        const toMemos: EdgeMemo[] =
          destinationTag == null || destinationTag === ''
            ? []
            : [
                {
                  type: destCurrencyInfo?.memoOptions?.[0]?.type ?? 'text',
                  value: destinationTag
                }
              ]

        // EVERY send-to-address quote is restricted to the Houdini privacy
        // provider, stealth toggle on or off: send-to-any is a privacy
        // feature and must never fan out to other swap providers. The toggle
        // decides whether the route itself must be private: without
        // `privacy: 'required'` Houdini may answer with a standard route,
        // which is correct for a plain Swap & Send and would silently
        // downgrade a Stealth one.
        const quotes = await account.fetchSwapQuotes(
          {
            fromWallet: coreWallet,
            fromTokenId: tokenId,
            toTokenId: null,
            toAddressInfo: {
              toPluginId: destPluginId,
              toAddress,
              toMemos
            },
            nativeAmount: quoteNativeAmount,
            quoteFor: guaranteedSide === 'send' ? 'from' : 'to',
            privacy: stealth ? 'required' : undefined
          },
          makeStealthSwapRequestOptions(account, undefined, {
            ignoreProviderSetting: true
          })
        )
        const quote = quotes[0]

        if (generation !== swapQuoteGeneration.current) return
        if (quote == null) {
          // fetchSwapQuotes normally throws when nothing can route, but it
          // resolves with an empty list if every plugin simply declines.
          // Reading toNativeAmount off that would crash the scene.
          setSwapQuote(undefined)
          setSwapError(
            new I18nError(
              lstrings.trade_option_no_quotes_title,
              lstrings.trade_option_no_quotes_body
            )
          )
          return
        }
        setSwapQuote(quote)
        clearSwapError()
        setRateStarvedFallback(false)
        // Update the estimated side from the live quote:
        if (guaranteedSide === 'send') {
          setReceiveNativeAmount(quote.toNativeAmount)
        } else {
          spendInfo.spendTargets[0].nativeAmount = quote.fromNativeAmount
          setSpendInfo({ ...spendInfo })
        }
        needsScrollToEnd.current = true
      } catch (err: unknown) {
        if (generation !== swapQuoteGeneration.current) return
        setSwapQuote(undefined)
        // A missing route is a capability of the PAIR, not a transient fault:
        // remember it, degrade to what the provider does offer, and say so.
        // Amount errors (below/above limit) fall through to the error card,
        // since those routes exist and the amount is the problem.
        if (asMaybeSwapCurrencyError(err) != null) {
          if (guaranteedSide === 'receive') {
            // No receive-priced route. Guarantee the send side instead,
            // seeded from display rates so the send stays actionable, and
            // warn that the recipient amount is no longer exact.
            markRouteCap('fixedTo')
            // Read the rates through the ref, not the closure. This effect
            // deliberately does not depend on `exchangeRates` (see its
            // dependency list), so the captured copy can predate a rate that
            // has since loaded.
            const { rates, isoFiat } = ratesRef.current
            const destRate = getExchangeRate(rates, destPluginId, null, isoFiat)
            const srcRate = getExchangeRate(rates, pluginId, tokenId, isoFiat)
            if (
              receiveNativeAmount != null &&
              destExchangeDenom != null &&
              destRate > 0 &&
              srcRate > 0
            ) {
              const receiveExchange = div(
                receiveNativeAmount,
                destExchangeDenom.multiplier,
                DECIMAL_PRECISION
              )
              const fromExchange = div(
                mul(receiveExchange, String(destRate)),
                String(srcRate),
                DECIMAL_PRECISION
              )
              spendInfo.spendTargets[0].nativeAmount = toFixed(
                mul(fromExchange, cryptoExchangeDenomination.multiplier),
                0,
                0
              )
              setSpendInfo({ ...spendInfo })
              setGuaranteedSide('send')
              setFixedToFallback(true)
              setRateStarvedFallback(false)
              clearSwapError()
              showToast(lstrings.stealth_fixed_to_unavailable_toast)
            } else {
              // The send side cannot be seeded without a rate on both ends,
              // and switching to it empty strands the scene: the quote effect
              // returns early on a zero send amount, so the user would be left
              // holding a warning with no quote and no way to get one. Show
              // the provider's own error instead, and remember that a rate is
              // all that was missing, so the retry below can take over once
              // one arrives.
              setSwapError(describeSwapError(err))
              setRateStarvedFallback(true)
            }
          } else if (stealth && !crossAssetPicked) {
            // No private route, and the toggle is the only thing making this a
            // swap: turning it off degrades to a plain same-chain send, so do
            // that and say why. That covers a token send to its own chain too,
            // which pays out native and so is cross-ASSET but still degrades.
            // Once a recipient asset has been adopted the send is
            // Houdini-routed either way, so disabling the toggle cannot help;
            // fall through to the error card instead.
            markRouteCap('stealth')
            setStealth(false)
            clearSwapError()
            showToast(lstrings.stealth_route_unavailable_toast)
          } else {
            setSwapError(describeSwapError(err))
          }
        } else {
          setSwapError(describeSwapError(err))
        }
      } finally {
        if (generation === swapQuoteGeneration.current) {
          setFetchingSwapQuote(false)
        }
      }
    },
    [
      swapSendActive,
      // The toggle changes the request: it decides whether the route must be
      // private, and which floor applies. Leaving it out left a Stealth quote
      // showing standard-route pricing on a cross-asset pair, which is the
      // re-quote gap the feedback round called out.
      stealth,
      belowActiveFloor,
      // The order is created against THIS wallet's refund address, so a switch
      // to another wallet on the same asset must re-quote rather than keep the
      // previous wallet's order armed.
      coreWallet.id,
      spendInfo.spendTargets[0].publicAddress,
      guaranteedSide,
      guaranteedSide === 'send'
        ? spendInfo.spendTargets[0].nativeAmount
        : receiveNativeAmount,
      destPluginId,
      destinationTag,
      swapQuoteNonce
    ],
    'SendComponent:swapQuote'
  )

  // Mirror the quote into its ref, so a read that resumes after an await sees
  // the retirement rather than the value its render closed over.
  React.useEffect(() => {
    swapQuoteRef.current = swapQuote
  }, [swapQuote])

  // Retry ONCE when the rate the fixed-to fallback was missing finally loads.
  // The fallback runs inside the quote effect, which cannot depend on
  // `exchangeRates` without re-quoting on every rate tick, so a failure that
  // happened before rates loaded would otherwise sit on a hard error until the
  // user edited a field. Keyed on the rates becoming usable rather than on the
  // rates object changing, so a later tick cannot trigger a second request.
  React.useEffect(() => {
    if (!rateStarvedFallback) return
    const destRate = getExchangeRate(
      exchangeRates,
      destPluginId,
      null,
      defaultIsoFiat
    )
    const srcRate = getExchangeRate(
      exchangeRates,
      pluginId,
      tokenId,
      defaultIsoFiat
    )
    if (destRate <= 0 || srcRate <= 0) return
    setRateStarvedFallback(false)
    setSwapQuoteNonce(nonce => nonce + 1)
  }, [
    defaultIsoFiat,
    destPluginId,
    exchangeRates,
    pluginId,
    rateStarvedFallback,
    tokenId
  ])

  const showSlider = spendInfo.spendTargets[0].publicAddress != null
  let disableSlider = false
  let disabledText: string | undefined

  if (swapSendActive) {
    // A send-to-address swap submits its live quote:
    disableSlider = swapQuote == null || fetchingSwapQuote
    // Same PIN gate the plain-send branch below applies: without this the
    // swap-send slider stayed live and never prompted for the PIN.
    if (
      !disableSlider &&
      pinSpendingLimitsEnabled &&
      spendingLimitExceeded &&
      (pinValue?.length ?? 0) < PIN_MAX_LENGTH
    ) {
      disableSlider = true
      disabledText = lstrings.spending_limits_enter_pin
    }
  } else if (
    edgeTransaction == null ||
    processingAmountChanged ||
    (zeroString(spendInfo.spendTargets[0].nativeAmount) &&
      getSpecialCurrencyInfo(pluginId).allowZeroTx !== true)
  ) {
    disableSlider = true
  } else if (
    pinSpendingLimitsEnabled &&
    spendingLimitExceeded &&
    (pinValue?.length ?? 0) < PIN_MAX_LENGTH
  ) {
    disableSlider = true
    disabledText = lstrings.spending_limits_enter_pin
  }

  if (hasPendingTx) {
    disableSlider = true
  }

  // An expired payment request cannot be paid in EITHER mode, so this sits
  // outside the swap-send branch above.
  if (addressExpired) {
    disableSlider = true
  }

  const accentColors: AccentColors = {
    // Transparent fallback for while iconColor is loading
    iconAccentColor: iconColor ?? '#00000000'
  }

  const backgroundColors = [...theme.assetBackgroundGradientColors]
  if (iconColor != null && theme.isDark) {
    const scaledColor = darkenHexColor(
      iconColor,
      theme.assetBackgroundColorScale
    )
    backgroundColors[0] = scaledColor
  }

  React.useEffect(() => {
    // Hack: While you would think to use InteractionManager.runAfterInteractions,
    // it doesn't work because several renders occur before the full height is
    // determined and the scrollToEnd call would be effective.
    const timeout = setTimeout(() => {
      if (needsScrollToEnd.current) {
        scrollViewRef.current?.scrollToEnd(true)
        needsScrollToEnd.current = false
      }
    }, SCROLL_TO_END_DELAY_MS)
    return () => {
      clearTimeout(timeout)
    }
  })

  return (
    <SceneWrapper
      accentColors={accentColors}
      padding={theme.rem(0.5)}
      backgroundGradientColors={backgroundColors}
      backgroundGradientEnd={theme.assetBackgroundGradientEnd}
      backgroundGradientStart={theme.assetBackgroundGradientStart}
      overrideDots={theme.backgroundDots.assetOverrideDots}
    >
      {({ insetStyle }) => {
        // We only need a bit more room under the slider when it's against
        // the bottom edge of the screen to improve usability — things
        // close to the edges of the screen are hard to access. When
        // notifications push the slider up away from the bottom edge,
        // reduce the bottom margin.
        const sliderBottom =
          insetStyle.paddingBottom +
          (hasNotifications ? theme.rem(1) : theme.rem(2))
        return (
          <>
            <KeyboardAwareScrollView
              style={styles.keyboardAwareScrollView}
              innerRef={ref => {
                const kbRef: KeyboardAwareScrollView | null = ref as any
                scrollViewRef.current = kbRef
              }}
              contentContainerStyle={{
                ...insetStyle,
                paddingTop: 0,
                paddingBottom: theme.rem(5)
              }}
              extraScrollHeight={theme.rem(2.75)}
              enableOnAndroid
              scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
            >
              <EdgeAnim enter={{ type: 'fadeInUp', distance: 80 }}>
                <EdgeCard sections>
                  {renderSelectedWallet()}
                  {renderSelectFioAddress()}
                  {swapSendActive &&
                  spendInfo.spendTargets[0].publicAddress != null
                    ? renderYouSendRow()
                    : null}
                  {swapSendActive ? renderSwapFeeRow() : null}
                </EdgeCard>
              </EdgeAnim>
              <EdgeAnim enter={{ type: 'fadeInUp', distance: 40 }}>
                <EdgeCard sections>
                  {renderRecipientReceives()}
                  {renderAddressAmountPairs()}
                  {swapSendActive &&
                  spendInfo.spendTargets[0].publicAddress != null
                    ? renderRecipientGetsRow()
                    : null}
                  {swapSendActive ? renderDestinationTagRow() : null}
                  {swapSendActive ? renderSwapQuoteRow() : null}
                  {renderTimeout()}
                </EdgeCard>
              </EdgeAnim>
              <EdgeAnim enter={{ type: 'fadeInDown', distance: 40 }}>
                <EdgeCard sections>{renderAddAddress()}</EdgeCard>
              </EdgeAnim>
              {renderStealthToggle()}
              <EdgeAnim enter={{ type: 'fadeInDown', distance: 40 }}>
                <EdgeCard sections>
                  {renderMultiRecipientTotal()}
                  {renderFees()}
                  {renderMetadataNotes()}
                  {renderMemoOptions()}
                  {renderInfoTiles()}
                  {renderAuthentication()}
                </EdgeCard>
              </EdgeAnim>
              <EdgeAnim enter={{ type: 'fadeInDown', distance: 80 }}>
                {renderScamWarning()}
              </EdgeAnim>
              {renderPendingTransactionWarning()}
              {renderFixedToFallbackWarning()}
              {renderNymWarning()}
              {renderError()}
              {sliderTopNode}
            </KeyboardAwareScrollView>
            <View style={[styles.sliderView, { bottom: sliderBottom }]}>
              {showSlider && (
                <EdgeAnim enter={{ type: 'fadeInDown', distance: 120 }}>
                  <SafeSlider
                    disabledText={disabledText}
                    confirmText={
                      swapSendActive && stealth
                        ? lstrings.stealth_slide_send
                        : undefined
                    }
                    onSlidingComplete={handleSliderComplete}
                    disabled={disableSlider}
                  />
                </EdgeAnim>
              )}
            </View>
          </>
        )
      }}
    </SceneWrapper>
  )
}

export const SendScene2 = React.memo(SendComponent)

const getStyles = cacheStyles((theme: Theme) => ({
  keyboardAwareScrollView: {
    margin: theme.rem(0.5),
    marginBottom: 0
  },
  sliderView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute'
  },
  calcFeeView: {
    flexDirection: 'row'
  },
  swapAmountRow: {
    alignItems: 'flex-start'
  },
  swapAmountText: {
    fontSize: theme.rem(1)
  },
  swapAssetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // Match the visual title-to-body gap of a text row: an icon fills its
    // box, so it lacks the font line-box whitespace a text body carries.
    marginTop: theme.rem(0.375)
  },
  providerHint: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  calcFeeSpinner: {
    marginLeft: theme.rem(1)
  },
  contentContainerStyle: { paddingBottom: theme.rem(6) },
  pinContainer: {
    marginTop: theme.rem(0.25)
  },
  pinInput: {
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    color: theme.primaryText,
    position: 'absolute',
    width: 0,
    height: 0
  }
}))

/**
 * The display name and currency code for an asset, or `undefined` when the
 * account has no plugin or token for it.
 */
function describeAsset(
  account: EdgeAccount,
  asset: EdgeAsset
): { currencyCode: string; displayName: string } | undefined {
  const currencyConfig = account.currencyConfig[asset.pluginId]
  if (currencyConfig == null) return undefined
  if (asset.tokenId == null) {
    const { currencyCode, displayName } = currencyConfig.currencyInfo
    return { currencyCode, displayName }
  }
  const token = currencyConfig.allTokens[asset.tokenId]
  if (token == null) return undefined
  const { currencyCode, displayName } = token
  return { currencyCode, displayName }
}
