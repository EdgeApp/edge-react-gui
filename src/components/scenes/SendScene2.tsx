import { abs, add, div, gte, lt, lte, mul, sub, toFixed } from 'biggystring'
import { asMaybe } from 'cleaners'
import {
  asMaybeInsufficientFundsError,
  asMaybeNoAmountSpecifiedError,
  asMaybePendingFundsError,
  asMaybeSwapCurrencyError,
  type EdgeAccount,
  type EdgeAddress,
  type EdgeCurrencyConfig,
  type EdgeCurrencyWallet,
  type EdgeDenomination,
  type EdgeMemo,
  type EdgeMemoOption,
  type EdgeParsedUri,
  type EdgeSpendInfo,
  type EdgeSpendTarget,
  type EdgeSwapQuote,
  type EdgeTokenId,
  type EdgeTransaction,
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
import type { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { sprintf } from 'sprintf-js'

import type { GuiExchangeRates } from '../../actions/ExchangeRateActions'
import { showSendScamWarningModal } from '../../actions/ScamWarningActions'
import {
  addressWarnings,
  checkAndShowGetCryptoModal
} from '../../actions/ScanActions'
import { setStealthSendEnabled } from '../../actions/SettingsActions'
import { playSendSound } from '../../actions/SoundActions'
import { showSwapSendWarningModal } from '../../actions/SwapSendWarningActions'
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
import type { GradientColors } from '../../types/Theme'
import type { EdgeAsset, FioRequest } from '../../types/types'
import { describeAddressRejection } from '../../util/addressRejection'
import {
  getCurrencyCode,
  isEvmWallet,
  isOwnEvmAddress
} from '../../util/CurrencyInfoHelpers'
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
  getHoudiniAssets,
  getHoudiniAssetSupport,
  getHoudiniChain,
  getMemoCarry,
  getOwnNetworkBlock,
  getRecipientAsset,
  getRecipientAssetChoices,
  getSelfTransferPick,
  getWalletSwitchMemoCarry,
  getWalletSwitchReset,
  HOUDINI_MIN_USD,
  isOwnChainAddressText,
  isReceiveSideGuaranteed,
  keepEnteredAmount,
  makeSwapSendRequest,
  pickKeepsRecipient,
  type RecipientAssetChoice,
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
import {
  type CrossChainPayment,
  findPayableChains,
  getUriAmountSide,
  parseCrossChainPayment,
  parseOwnNetworkPayment,
  peekPaymentUri
} from '../../util/paymentUri'
import {
  disableAssetsCover,
  getStealthDisableAssets,
  getStealthProviderName,
  makeStealthSwapRequestOptions,
  STEALTH_SWAP_PLUGIN_ID
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
import { RecipientAssetListModal } from '../modals/RecipientAssetListModal'
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

// Error names an engine assigns when the node explicitly refused the
// transaction. Nothing was accepted, so the existing copy for these can name
// the real fix (stake more CPU, activate the recipient) instead of the
// ambiguous "status unknown" card.
const DETERMINISTIC_REJECTIONS = new Set([
  'ErrorAlgoRecipientNotActivated',
  'ErrorEosInsufficientCpu',
  'ErrorEosInsufficientNet',
  'ErrorEosInsufficientRam'
])

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
  /**
   * Sets the Stealth Send toggle for this visit, in place of the account's
   * saved choice. Never saved itself. Arming is ignored wherever a tap on the
   * toggle would be refused, or where the toggle is not offered at all.
   */
  stealth?: boolean
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

const SendComponent: React.FC<Props> = props => {
  const { route, navigation } = props
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const needsScrollToEnd = React.useRef<boolean>(false)
  const makeSpendCounter = React.useRef<number>(0)
  const scrollViewRef = React.useRef<KeyboardAwareScrollViewRef>(null)
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
    doCheckAndShowGetCryptoModal = true,
    stealth: stealthParam
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
  // Once a broadcast has been attempted, the confirm slider never re-arms on
  // this scene, whether the broadcast reported success or failure. A failure
  // report does not prove the transaction is absent from the network, and a
  // re-armed slider after a real broadcast is an invitation to pay twice.
  // The ref is what the send handler reads (it survives the FIO retry
  // recursion); the state is what drives the render.
  const broadcastAttemptedRef = React.useRef<boolean>(false)
  const [broadcastAttempted, setBroadcastAttempted] = useState<boolean>(false)
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
  // asset, or enabling stealth, turns the send into a swap-to-address quote.
  const [pickedRecipientAsset, setPickedRecipientAsset] = useState<
    EdgeAsset | undefined
  >(undefined)
  const [stealth, setStealth] = useState<boolean>(false)
  const [destinationTag, setDestinationTag] = useState<string | undefined>(
    undefined
  )
  // Every address of the user's own wallet when it was picked as the
  // recipient, so the swap provider can pay out to the address type it
  // supports. Undefined for a pasted, typed, or scanned recipient.
  const [recipientWalletAddresses, setRecipientWalletAddresses] = useState<
    EdgeAddress[] | undefined
  >(undefined)
  const [swapQuote, setSwapQuote] = useState<EdgeSwapQuote | undefined>(
    undefined
  )
  const [fetchingSwapQuote, setFetchingSwapQuote] = useState<boolean>(false)
  const [guaranteedSide, setGuaranteedSide] = useState<'send' | 'receive'>(
    'send'
  )
  // The fixed receive amount (the destination asset's native units) when the
  // user edits "Recipient gets"; otherwise the latest quote's estimate.
  const [receiveNativeAmount, setReceiveNativeAmount] = useState<
    string | undefined
  >(undefined)
  // Bumped when the quote expires, to force a re-quote:
  const [swapQuoteNonce, setSwapQuoteNonce] = useState<number>(0)
  // Route capabilities learned from the provider's live answers, keyed by
  // `${sourcePluginId}:${tokenId}->${destPluginId}:${destTokenId}`.
  // Availability is a live provider property (routes appear and disappear
  // between sessions), so the scene learns it from real quote failures and
  // reflects it pre-emptively from then on, rather than trusting a static
  // table that would go stale.
  const [routeCaps, setRouteCaps] = useState<
    Record<string, { stealth?: boolean; fixedTo?: boolean }>
  >({})
  // The fixed-to fallback wanted to seed a send amount but had no exchange rate
  // to seed it from. Cleared by the one retry that fires when rates arrive.
  const [rateStarvedFallback, setRateStarvedFallback] = useState<boolean>(false)
  // The quote an approval in flight is signing. Retiring that quote must not
  // close it under the approval, so the approval closes it once it finishes.
  const approvingSwapQuoteRef = React.useRef<EdgeSwapQuote | undefined>(
    undefined
  )
  const closeAfterApprovalRef = React.useRef<boolean>(false)
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
  const stealthSendEnabled = useSelector<boolean>(
    state => state.ui.settings.stealthSendEnabled
  )
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
  // The info server's swap kill switch. A send-to-address quote is a swap, so
  // a provider or asset switched off there must stop it the same as on the
  // Exchange scene:
  const swapDisablePlugins = useSelector(
    state => state.ui.exchangeInfo.swap.disablePlugins
  )
  const disableAssets = useSelector(
    state => state.ui.exchangeInfo.swap.disableAssets
  )
  const disableAssetsByPlugin = useSelector(
    state => state.ui.exchangeInfo.swap.disableAssetsByPlugin
  )
  // An asset banned for the stealth provider alone is refused like one banned
  // for every swap, since no other provider answers a send-to-address quote:
  const swapDisableAssets = React.useMemo(
    () => getStealthDisableAssets(disableAssets, disableAssetsByPlugin),
    [disableAssets, disableAssetsByPlugin]
  )
  // The chains and assets Houdini routes, coins and tokens both, served by
  // the info server. Empty until a rollup carrying the list loads, which
  // hides the swap UI (see `swapSendAllowed`):
  const houdiniChains = useSelector(state => state.ui.houdiniChains)

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
  // broadcast/completion flow keep today's behavior untouched. Until the info
  // server serves Houdini's list there is nothing to route, so the swap UI
  // stays hidden rather than offering destinations from a stale copy.
  const swapSendAllowed =
    houdiniChains.size > 0 &&
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
  const destPluginId = pickedRecipientAsset?.pluginId ?? pluginId
  const destTokenId =
    pickedRecipientAsset == null ? tokenId : pickedRecipientAsset.tokenId
  const sameAsset = destPluginId === pluginId && destTokenId === tokenId
  /**
   * A recipient asset was explicitly adopted. This is what turns a plain send
   * into a swap-send on its own, and it is also the test for whether turning
   * Stealth off would help: without an adopted recipient, the toggle is the
   * only thing making this a swap, so switching it off degrades to a plain
   * same-chain send.
   */
  const crossAssetPicked = pickedRecipientAsset != null && !sameAsset
  const swapSendActive = swapSendAllowed && (stealth || crossAssetPicked)
  /**
   * The asset the recipient ends up with, which the "Recipient receives" row
   * and its picker both name. A swap-send pays out the destination asset; a
   * plain send delivers the source asset.
   */
  const recipientAsset = getRecipientAsset({
    source: { pluginId, tokenId },
    destination: { pluginId: destPluginId, tokenId: destTokenId },
    swapSendActive
  })
  const destChain = swapSendActive
    ? getHoudiniChain(houdiniChains, destPluginId)
    : undefined
  const destCurrencyConfig = account.currencyConfig[destPluginId]
  const destCurrencyInfo = destCurrencyConfig?.currencyInfo
  const destDescription = describeAsset(account, {
    pluginId: destPluginId,
    tokenId: destTokenId
  })
  const destCurrencyCode = destDescription?.currencyCode
  const destExchangeDenom =
    destCurrencyConfig == null
      ? undefined
      : getExchangeDenom(destCurrencyConfig, destTokenId)
  // Called unconditionally to keep hook order stable; the value is only read
  // once a destination asset is actually selected. Limits are quoted in the
  // denomination the user reads elsewhere, not the exchange one.
  const destDisplayDenom = useDisplayDenom(
    destCurrencyConfig ?? coreWallet.currencyConfig,
    destCurrencyConfig == null ? tokenId : destTokenId
  )

  /** What Houdini serves for the source asset, or `undefined` for nothing. */
  const sourceAssetSupport = getHoudiniAssetSupport({
    asset: { pluginId, tokenId },
    houdiniChains
  })

  /**
   * Whether Houdini can route the source asset to ITSELF privately, which is
   * what a same-asset Stealth Send asks for. An asset Houdini does not serve
   * has no private route to itself.
   */
  const selfPrivateAvailable = sourceAssetSupport?.hasSelfPrivate === true

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
      useSendSide ? tokenId : destTokenId,
      'iso:USD',
      div(nativeAmount, multiplier, DECIMAL_PRECISION)
    )
    return zeroString(usdValue) ? undefined : usdValue
  }, [
    cryptoExchangeDenomination.multiplier,
    destExchangeDenom?.multiplier,
    destPluginId,
    destTokenId,
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
  // Derived during render rather than written from the makeSpend effect: that
  // effect runs AFTER the render that already holds a live quote, so a flag it
  // wrote would lag a frame behind an armed slider. Computing it here makes the
  // gate and the amount it judges come from the same render.
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
      swapRequest: makeSwapSendRequest({
        fromWallet: coreWallet,
        fromTokenId: tokenId,
        destination: { pluginId: destPluginId, tokenId: destTokenId },
        toAddress: spendInfo.spendTargets[0].publicAddress ?? '',
        walletAddresses: recipientWalletAddresses,
        nativeAmount: spendInfo.spendTargets[0].nativeAmount ?? '0',
        guaranteedSide
      }),
      fromDenomination: cryptoDisplayDenomination,
      toDenomination: destDisplayDenom,
      toCurrencyCode: destCurrencyCode
    })
    return info == null ? error : new I18nError(info.title, info.message)
  }
  const multipleTargets = spendInfo.spendTargets.length > 1

  // What the provider is known to offer for the current pair. `false` means a
  // live quote already came back without that capability this session;
  // `undefined` means untested, so the UI assumes available until told
  // otherwise.
  const routePairKey = `${pluginId}:${String(
    tokenId
  )}->${destPluginId}:${String(destTokenId)}`
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
   * An asset the info server bans for the provider on its side has no route
   * at all, the same reason the Exchange scene dims its toggle for.
   */
  const stealthBlockedReason: string | undefined = disableAssetsCover(
    swapDisableAssets.source,
    pluginId,
    tokenId
  )
    ? sprintf(lstrings.stealth_asset_unsupported_1s, currencyCode)
    : disableAssetsCover(
        swapDisableAssets.destination,
        destPluginId,
        destTokenId
      )
    ? sprintf(
        lstrings.stealth_asset_unsupported_1s,
        destCurrencyCode ?? destTokenId ?? destPluginId
      )
    : sameAsset && !selfPrivateAvailable
    ? sprintf(
        // An asset the provider does not serve at all has no route of any
        // kind, so the "to itself" wording would only mislead:
        sourceAssetSupport == null
          ? lstrings.stealth_asset_unsupported_1s
          : lstrings.stealth_self_private_unsupported_1s,
        currencyCode
      )
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

  /**
   * The first time this scene turns into a swap, say so. The recipient is no
   * longer paid by this wallet, and the two-transaction shape is the part a
   * user cannot infer from the scene. Shown once per account; the swap
   * provider names itself so the copy survives a provider change.
   */
  const stealthSwapConfig = account.swapConfig[STEALTH_SWAP_PLUGIN_ID]
  React.useEffect(() => {
    if (!swapSendActive || stealthSwapConfig == null) return
    showSwapSendWarningModal(
      account.disklet,
      stealthSwapConfig.swapInfo.displayName
    ).catch((err: unknown) => {
      showError(err)
    })
  }, [account.disklet, stealthSwapConfig, swapSendActive])

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
   * The tag rides the request's `toMemos` into the quote request, so it is one
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
    async (
      changeAddressResult: ChangeAddressResult,
      /**
       * Set by a caller that just cleared the picked destination, which makes
       * this a same-asset send although the render-time state still shows
       * the old cross-asset one.
       */
      destinationCleared: boolean = false
    ): Promise<void> => {
      const {
        addressEntryMethod,
        parsedUri,
        fioAddress,
        alias,
        resolvedName,
        crossChainNativeAmount,
        crossChainMemo,
        detectedDestPluginId,
        walletAddresses
      } = changeAddressResult

      // A destination detected from the address itself makes this a cross-asset
      // send. `setPickedRecipientAsset` has not re-rendered yet, so the routing
      // below reads the detected chain rather than the stale render-time state.
      const uriGuaranteesReceiveSide = isReceiveSideGuaranteed({
        detectedDestPluginId,
        destinationCleared,
        swapSendActive,
        sameAsset
      })

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
        //
        // A same-chain destination is parsed by the sending wallet instead,
        // which reports the tag as `uniqueIdentifier`. The quote reads the tag
        // row alone, so leaving that value on the plain-send memo would quote
        // an exchange deposit with no tag and pay it uncredited.
        //
        // A caller that just cleared the destination leaves the render-time
        // `destChain` naming the old one, and the send now pays the source
        // asset: a private send pays it on the wallet's own chain, and a plain
        // send has no tag row.
        const memoDestChain = destinationCleared
          ? swapSendAllowed && stealth
            ? getHoudiniChain(houdiniChains, pluginId)
            : undefined
          : detectedDestPluginId == null
          ? destChain
          : getHoudiniChain(houdiniChains, detectedDestPluginId)
        const uriMemo = crossChainMemo ?? parsedUri.uniqueIdentifier
        if (
          memoDestChain?.memoNeeded === true &&
          uriMemo != null &&
          uriMemo !== ''
        ) {
          changeDestinationTag(uriMemo)
        }
        if (parsedUri.metadata != null) {
          spendInfo.metadata = parsedUri.metadata
        }
        spendTarget.uniqueIdentifier = parsedUri?.uniqueIdentifier
        spendTarget.publicAddress = parsedUri?.publicAddress

        if (uriGuaranteesReceiveSide) {
          // A cross-asset send prices the side whose asset the code states
          // its amount in (see `getUriAmountSide`). An amount in the payout
          // is what the recipient should receive, so it is the guaranteed
          // side and the send side is priced off the quote. One in the asset
          // being sent is what this wallet sends: priced as the payout it
          // would quote the wrong asset and size. A detected destination is
          // the coin of another chain, whose amount arrives as
          // `crossChainNativeAmount`.
          //
          // Same-asset (stealth) sends stay on the send side: guaranteeing the
          // receive side needs a receive-priced quote, and the provider offers
          // no fixed-rate route when the source and destination assets match.
          const uriAmount = getUriAmountSide({
            parsedUri,
            crossChainNativeAmount,
            sourceTokenId: tokenId,
            sameChainDestTokenId:
              detectedDestPluginId == null && destPluginId === pluginId
                ? destTokenId
                : undefined
          })
          spendTarget.nativeAmount =
            uriAmount?.side === 'send' ? uriAmount.nativeAmount : undefined
          if (uriAmount != null) {
            setReceiveNativeAmount(
              uriAmount.side === 'receive' ? uriAmount.nativeAmount : undefined
            )
            setGuaranteedSide(uriAmount.side)
          }
        } else {
          // A plain or same-asset send pays the source asset, so an amount
          // stated in any other asset prices nothing here. A coin `value` on
          // a token send (see `withStatedAsset`) would otherwise size the
          // token spend in wei.
          spendTarget.nativeAmount =
            parsedUri.tokenId === undefined || parsedUri.tokenId === tokenId
              ? parsedUri.nativeAmount
              : undefined
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
        setRecipientWalletAddresses(walletAddresses)
        setSpendInfo({ ...spendInfo, memos })
        needsScrollToEnd.current = true
      }
    }

  /**
   * Adopt a destination asset together with its address: the recipient asset
   * becomes that asset, any tag and quote held for the previous one is
   * dropped, and the address lands in the tile. Shared by address detection,
   * which infers the chain from the text and adopts its coin, and the "Myself"
   * picker, which knows the asset outright.
   */
  const adoptDestination =
    (spendTarget: EdgeSpendTarget) =>
    async (
      destAsset: EdgeAsset,
      publicAddress: string,
      addressEntryMethod: AddressEntryMethod,
      /**
       * What the new destination arrived with. A destination memo from a
       * scanned URI is passed in rather than written by the caller
       * beforehand, because the reset below clears the tag and would drop it.
       */
      destination: Pick<
        ChangeAddressResult,
        'crossChainNativeAmount' | 'crossChainMemo' | 'walletAddresses'
      > = {}
    ): Promise<void> => {
      const { crossChainNativeAmount, crossChainMemo } = destination
      setPickedRecipientAsset(destAsset)
      // A new destination invalidates any tag and quote held for the old one,
      // exactly as picking the recipient asset by hand does. A memo that came
      // WITH the new destination survives, since it describes this destination
      // rather than the one being left:
      setDestinationTag(crossChainMemo)
      setSwapQuote(undefined)
      setReceiveNativeAmount(undefined)
      setGuaranteedSide('send')

      // The send side is the guaranteed one now, so a destination that
      // arrived with no amount of its own keeps the one already entered:
      await handleChangeAddress(spendTarget)({
        ...destination,
        parsedUri:
          crossChainNativeAmount == null
            ? keepEnteredAmount(
                { publicAddress, tokenId },
                spendTarget.nativeAmount
              )
            : { publicAddress },
        addressEntryMethod,
        detectedDestPluginId: destAsset.pluginId
      })
    }

  /**
   * Set the recipient back to the wallet's own network for an address that
   * network's parser accepted. The tag and quote held for the network being
   * left are dropped, as picking the source asset under "Recipient receives"
   * does, and the whole parse lands in the tile, so a payment code keeps its
   * amount and memo. A bare address keeps the amount already entered, which
   * is in the source asset this send now pays.
   */
  const adoptOwnNetworkDestination =
    (spendTarget: EdgeSpendTarget) =>
    async (
      parsedUri: EdgeParsedUri,
      addressEntryMethod: AddressEntryMethod
    ): Promise<void> => {
      setPickedRecipientAsset(undefined)
      setDestinationTag(undefined)
      setSwapQuote(undefined)
      setReceiveNativeAmount(undefined)
      setGuaranteedSide('send')

      await handleChangeAddress(spendTarget)(
        {
          parsedUri: keepEnteredAmount(parsedUri, spendTarget.nativeAmount),
          addressEntryMethod
        },
        true
      )
    }

  /**
   * Every asset a swap-send can pay out: each chain the provider serves that
   * the account has a plugin for, followed by that chain's supported tokens,
   * less the destinations the info server withdrew. Both recipient pickers
   * read this list.
   */
  const destinationAssets = React.useMemo<EdgeAsset[]>(
    () =>
      getHoudiniAssets({
        bans: swapDisableAssets.destination,
        currencyConfigs: account.currencyConfig,
        houdiniChains
      }),
    [account.currencyConfig, houdiniChains, swapDisableAssets.destination]
  )

  /**
   * The recipient assets the "Myself" picker may offer: the source asset plus
   * every swap destination. The wallet picker lists a token only for the
   * wallets that have it enabled.
   */
  const selfTransferAssets = React.useMemo<EdgeAsset[] | undefined>(() => {
    if (!swapSendAllowed || multipleTargets) return undefined
    const source: EdgeAsset = { pluginId, tokenId }
    const sourceKey = recipientAssetKey(source)
    return [
      source,
      ...destinationAssets.filter(
        asset => recipientAssetKey(asset) !== sourceKey
      )
    ]
  }, [destinationAssets, multipleTargets, pluginId, swapSendAllowed, tokenId])

  /**
   * A "Myself" pick (see `getSelfTransferPick`). Another asset becomes the
   * destination along with its address. The source asset itself clears any
   * destination asset picked earlier, so a TRX wallet picked after "Tether on
   * Tron" pays TRX. Returns `false` for the tile to enter the address as a
   * plain send.
   */
  const handleSelfTransferAsset =
    (spendTarget: EdgeSpendTarget) =>
    async (
      destAsset: EdgeAsset,
      address: string,
      walletAddresses: EdgeAddress[]
    ): Promise<boolean> => {
      const pick = getSelfTransferPick({
        source: { pluginId, tokenId },
        picked: destAsset,
        sameAsset
      })
      if (pick === 'adopt') {
        await adoptDestination(spendTarget)(destAsset, address, 'other', {
          walletAddresses
        })
        return true
      }
      setPickedRecipientAsset(undefined)
      setDestinationTag(undefined)
      setSwapQuote(undefined)
      setReceiveNativeAmount(undefined)
      setGuaranteedSide('send')
      if (pick === 'plainSend') return false
      const parsedUri = await coreWallet.parseUri(address, currencyCode)
      await handleChangeAddress(spendTarget)(
        {
          parsedUri: keepEnteredAmount(parsedUri, spendTarget.nativeAmount),
          addressEntryMethod: 'other',
          walletAddresses
        },
        true
      )
      return true
    }

  /**
   * Rescues input the sending wallet could not parse. An address for another
   * chain is the ordinary way a user asks for a cross-chain send: they paste
   * the recipient's address before touching "Recipient receives". Detect the
   * chain it belongs to, adopt it as the destination, and keep the address.
   *
   * Every path that does not adopt the address resolves the reason for the
   * tile to show, since the scene is otherwise left exactly as it was.
   *
   * Adopting an address can change the recipient network without the user
   * naming it, and each such change is announced. A network the user picked
   * by name is not.
   */
  const handleUnparsedAddress =
    (spendTarget: EdgeSpendTarget) =>
    async (
      address: string,
      addressEntryMethod: AddressEntryMethod
    ): Promise<boolean | string> => {
      const networkNameOf = (id: string): string =>
        account.currencyConfig[id].currencyInfo.displayName

      const candidates = detectHoudiniChains(address, {
        houdiniChains,
        sourcePluginId: pluginId,
        sourceTokenId: tokenId,
        isSupported: id => account.currencyConfig[id] != null
      })
      // Fitting a network's format is not enough to call the text that
      // network's address: a mistyped address fits every network sharing its
      // format (a bad `0x` checksum fits every served EVM network), and only
      // a network's own parser checks the checksum. Each candidate's parser
      // has to accept the text, and what it read is kept for the adoption.
      const payable = await findPayableChains(
        candidates,
        candidate => account.currencyConfig[candidate.pluginId],
        address
      )
      // Text written for a network, bare or inside a payment URI that names
      // it, is a bad address on that network (a failed checksum), whatever
      // other networks share the format.
      const isFormatOf = (id: string): boolean => {
        const chain = getHoudiniChain(houdiniChains, id)
        return chain != null && isOwnChainAddressText(chain, address)
      }

      // A send that cannot become a swap only pays the wallet's own network,
      // so an address from elsewhere is called out as such. The wallet's own
      // network may be one the provider does not serve, which is why another
      // network has to accept the text before it is called that network's.
      if (!swapSendAllowed || multipleTargets) {
        const isOtherNetworkAddress =
          !isFormatOf(pluginId) && payable.length > 0
        return describeAddressRejection({
          type: isOtherNetworkAddress ? 'otherNetwork' : 'invalid',
          networkName: networkNameOf(pluginId)
        })
      }

      // A token payout on the wallet's own network is read by the wallet,
      // which the tile asks with the sent asset's code, and an EVM wallet
      // refuses a token's payment code asked that way. The payout token's own
      // code reads it, and the amount it states is what the recipient gets:
      if (
        swapSendActive &&
        destPluginId === pluginId &&
        destTokenId != null &&
        destTokenId !== tokenId &&
        destCurrencyCode != null &&
        peekPaymentUri(address).scheme != null
      ) {
        const payoutUri = await parseOwnNetworkPayment(
          coreWallet,
          destCurrencyCode,
          destTokenId,
          address
        )
        if (payoutUri != null) {
          if (await isOwnEvmAddress(coreWallet, payoutUri.publicAddress)) {
            return lstrings.send_to_self_error_message
          }
          if (!(await addressWarnings(payoutUri, destCurrencyCode))) return true
          // A parser that leaves the asset unstated read it as the token:
          await handleChangeAddress(spendTarget)({
            parsedUri: { ...payoutUri, tokenId: destTokenId },
            addressEntryMethod
          })
          return true
        }
      }

      // With another network picked for the recipient, the tile read the
      // text against that network alone, so the wallet's own parser has not
      // seen it yet. It reads the text before any other network does, as it
      // does on a plain send: an address it accepts sets the recipient back
      // to the source asset, whichever other networks share the format. A
      // legacy Bitcoin address also fits Bitcoin Cash, and an Ethereum one
      // fits every EVM network, and detection leaves the wallet's own network
      // out of its matches for a coin source.
      if (destPluginId !== pluginId) {
        const ownParsedUri = await parseOwnNetworkPayment(
          coreWallet,
          currencyCode,
          tokenId,
          address
        )
        if (ownParsedUri != null) {
          // The tile turns down a send to the wallet's own address before it
          // adopts one, and this path adopts in the tile's place:
          if (await isOwnEvmAddress(coreWallet, ownParsedUri.publicAddress)) {
            return lstrings.send_to_self_error_message
          }
          // A private send only switches when the provider routes it, which
          // is what the Stealth toggle checks before arming. The decline
          // reads the same as the toggle's refusal:
          const sourceKey = `${pluginId}:${String(tokenId)}`
          const ownNetworkBlock = getOwnNetworkBlock({
            stealthActive: stealth,
            selfPrivateAvailable,
            privateRouteOffered:
              routeCaps[`${sourceKey}->${sourceKey}`]?.stealth
          })
          if (ownNetworkBlock === 'selfPrivateUnsupported') {
            return sprintf(
              lstrings.stealth_self_private_unsupported_1s,
              currencyCode
            )
          }
          if (ownNetworkBlock === 'privateRouteUnavailable') {
            return lstrings.stealth_route_unavailable_info
          }
          // The tile asks these before it adopts an address on the wallet's
          // network. Turning one down is the user's answer, not an error:
          if (!(await addressWarnings(ownParsedUri, currencyCode))) return true

          await adoptOwnNetworkDestination(spendTarget)(
            ownParsedUri,
            addressEntryMethod
          )
          showToast(
            sprintf(
              lstrings.send_recipient_network_changed_1s,
              networkNameOf(pluginId)
            )
          )
          return true
        }
      }

      // No network takes the text. Text in the format of the network it was
      // read against, the picked recipient network or else the wallet's own,
      // is a typo there, which detection cannot see because it leaves the
      // wallet's own network out of its matches for a coin source. A lone
      // format match is a typo on that network. Anything else is a genuine
      // typo, or a network no swap can pay out to.
      if (payable.length === 0) {
        const typoPluginId = [destPluginId, pluginId].find(isFormatOf)
        if (typoPluginId != null) {
          return describeAddressRejection({
            type: 'invalid',
            networkName: networkNameOf(typoPluginId)
          })
        }
        if (candidates.length === 1) {
          return describeAddressRejection({
            type: 'invalid',
            networkName: networkNameOf(candidates[0].pluginId)
          })
        }
        // An EVM network the provider does not serve has no format entry, but
        // it shares the one format every EVM network writes, so text only EVM
        // networks fit is a typo on the wallet's own:
        if (
          candidates.length > 0 &&
          candidates.every(candidate => candidate.evmChainId != null) &&
          isEvmWallet(coreWallet)
        ) {
          return describeAddressRejection({
            type: 'invalid',
            networkName: networkNameOf(pluginId)
          })
        }
        return describeAddressRejection({ type: 'unrecognized' })
      }

      // An address accepted by several chains (any EVM `0x…` that passes
      // their checksums) cannot be resolved from the address alone, and
      // guessing would send the funds to the wrong network, so the user names
      // the network.
      let { chain, payment } = payable[0]
      if (payable.length > 1) {
        const items = payable.map(({ chain: candidate }) => {
          const { currencyCode: chainCode, displayName } =
            account.currencyConfig[candidate.pluginId].currencyInfo
          return {
            name: displayName,
            text: chainCode,
            value: candidate.pluginId,
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
        const picked = payable.find(
          candidate => candidate.chain.pluginId === selected
        )
        // Dismissing the picker is a deliberate cancel, not a bad address, so
        // it is acknowledged rather than reported as an error.
        if (picked == null) {
          showToast(lstrings.send_address_no_network_selected)
          return true
        }
        chain = picked.chain
        payment = picked.payment
      }
      const { publicAddress, nativeAmount, memo } = payment

      // A scanned exchange deposit code carries the tag that credits the
      // recipient. Adopting the address and dropping the tag pays the exchange
      // with nothing to attribute it to, which is a loss the user cannot see.
      const crossChainMemo =
        chain.memoNeeded && memo != null && memo !== '' ? memo : undefined

      // Detection reads the chain off the address, so the chain's own coin is
      // the destination. A token on it is one more pick in the recipient row:
      await adoptDestination(spendTarget)(
        { pluginId: chain.pluginId, tokenId: null },
        publicAddress,
        addressEntryMethod,
        { crossChainNativeAmount: nativeAmount, crossChainMemo }
      )
      // A lone match is adopted without asking, so the change is announced.
      // Several matches went through the picker, where the user named it.
      if (payable.length === 1 && chain.pluginId !== destPluginId) {
        showToast(
          sprintf(
            lstrings.send_recipient_network_changed_1s,
            networkNameOf(chain.pluginId)
          )
        )
      }
      return true
    }

  const handleAddressAmountPress = (index: number) => (): void => {
    // This is deleting the combo address/amount tile. If this happens, remove the
    // lastAddressEntryMethod so we don't auto launch the camera again.
    setLastAddressEntryMethod(undefined)
    spendInfo.spendTargets.splice(index, 1)
    // The picked wallet's addresses belong to the first target only:
    if (index === 0) setRecipientWalletAddresses(undefined)
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
        key={`addressAmount${index}`}
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
    // Keep the locked-state card if a broadcast has been attempted. Otherwise
    // clear through the owners, not `setError` directly: a bare clear leaves
    // `swapErrorShown` believing a swap error is still on screen, and the next
    // plain-send failure then cannot retract itself.
    //
    // The expiry flag is lowered BEFORE the retraction, not after: the
    // retraction reads that flag and declines while it is raised, so clearing
    // in the other order leaves the expiry card on screen over an address the
    // user just removed, with the slider re-enabled beneath it.
    if (!broadcastAttemptedRef.current) {
      clearSwapError()
      setAddressExpired(false)
      clearPlainSendError()
    }
    setExpireDate(undefined)
    setPinValue(undefined)
    // Clearing the address ends the swap-send: leaving the destination asset,
    // tag, receive amount or standing quote behind means the next address
    // entered gets quoted against the previous recipient's state.
    setSwapQuote(undefined)
    setReceiveNativeAmount(undefined)
    setGuaranteedSide('send')
    setPickedRecipientAsset(undefined)
    setDestinationTag(undefined)
    setRecipientWalletAddresses(undefined)
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
      // wallet; parse it with the destination chain's own plugin:
      const parseCrossChainAddress =
        swapSendActive && destPluginId !== pluginId
          ? async (text: string): Promise<CrossChainPayment | undefined> => {
              if (destChain == null) return
              const uri = peekPaymentUri(text)
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
                uri.evmChainId !== destChain.evmChainId
              ) {
                return
              }
              if (
                uri.scheme != null &&
                uri.evmChainId == null &&
                !schemeNamesChain(uri.scheme, destChain)
              ) {
                return
              }
              // A token payout accepts a code for that token, and keeps its
              // amount only when the code states it in that token:
              return await parseCrossChainPayment(
                account.currencyConfig[destChain.pluginId],
                text,
                destTokenId
              )
            }
          : undefined

      return (
        <AddressTile2
          key={`address${index}`}
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
          parseCrossChainAddress={parseCrossChainAddress}
          onUnparsedAddress={handleUnparsedAddress(spendTarget)}
          selfTransfer={
            selfTransferAssets == null
              ? undefined
              : {
                  allowedAssets: selfTransferAssets,
                  onPickAsset: handleSelfTransferAsset(spendTarget)
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
    (index: number, spendTarget: EdgeSpendTarget) =>
    async (): Promise<void> => {
      const { noChangeMiningFee } = getSpecialCurrencyInfo(pluginId)
      // A max spend only has a defined meaning for a single recipient: it
      // consumes the entire spendable balance. Once the send has more than one
      // target there is nothing left over for the others, so the button is
      // hidden rather than allowed to produce an insufficient-funds spend.
      const isMultipleTargets = spendInfo.spendTargets.length > 1
      await Airship.show<FlipInputModalResult>(bridge => (
        <FlipInputModal2
          ref={flipInputModalRef}
          bridge={bridge}
          startNativeAmount={spendTarget.nativeAmount}
          feeTokenId={null}
          forceField={fieldChanged}
          hideMaxButton={isMultipleTargets}
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
          key={`amount${index}`}
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

  const handleWalletPress = useHandler(async (): Promise<void> => {
    await Airship.show<WalletListResult>(bridge => (
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
        const reset = getWalletSwitchReset({
          walletChanged,
          assetChanged,
          sameAsset
        })
        // The reset below disarms Stealth, so a tag typed for a same-asset
        // private send moves to the plain memo the kept address now reads:
        applyMemoCarry(
          getWalletSwitchMemoCarry({
            reset,
            swapBefore: swapSendActive,
            tag: destinationTag,
            plainMemo: spendInfo.memos?.[0]?.value,
            plainMemoSupported: memoOptions.some(
              option => option.hidden !== true
            )
          })
        )
        // A new source WALLET invalidates the swap-send destination state, not
        // just a new source asset: a held quote carries an order created for
        // the old wallet's refund address, so approving it after a switch would
        // spend from one wallet against another wallet's order, and that holds
        // between two wallets on the same asset. The fixed-to warning, the
        // Stealth toggle and the learned
        // route capabilities go too: all describe the pair and wallet the user
        // just left, so carrying them over produces auto-disables and errors
        // the user cannot connect to anything they did. The toggle is then
        // seeded afresh for the new pair, once a render describes it.
        if (reset !== 'none') {
          setPickedRecipientAsset(undefined)
          setDestinationTag(undefined)
          setSwapQuote(undefined)
          setReceiveNativeAmount(undefined)
          setGuaranteedSide('send')
          setRateStarvedFallback(false)
          setStealth(false)
          reseedStealthRef.current = true
          setRouteCaps({})
          // The message describes the pair and wallet the user just left, the
          // same reason the toggle and the route caps go. Through the owners,
          // so `swapErrorShown` does not survive the wallet it belonged to.
          // A locked-state card stays, as it does on an address reset.
          if (!broadcastAttemptedRef.current) {
            clearSwapError()
            setAddressExpired(false)
            clearPlainSendError()
          }
          // The recipients go with them whenever the address was entered for
          // another asset: a swap-send destination on a foreign chain, a token
          // payout on the source chain, or a different source asset. Clearing
          // the destination ASSET while leaving such an address behind drops
          // the scene back into plain-send mode still displaying it, one slide
          // from a send that can only fail (foreign chain) or that pays the
          // source asset where the user picked another (same-chain token). A
          // plain switch between two wallets on the SAME asset is the case
          // that must NOT clear: that address is still payable, and wiping it
          // only makes the user type it again.
          // Written once, as the whole spend: a second `setSpendInfo` here
          // would close over the pre-reset value and put the old targets back.
          if (reset === 'destinationAndRecipient') {
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

  /**
   * Call before a change that keeps the address but may switch between a
   * plain send and a swap-send: arming or disarming Stealth, or picking
   * another asset on the chain. The memo moves to the row the next mode reads
   * (see `getMemoCarry`), or a memo-required payout goes out with none.
   */
  const carryMemoAcrossModes = (swapAfter: boolean): void => {
    applyMemoCarry(
      getMemoCarry({
        swapBefore: swapSendActive,
        swapAfter,
        tag: destinationTag,
        plainMemo: spendInfo.memos?.[0]?.value,
        tagNeeded:
          getHoudiniChain(houdiniChains, destPluginId)?.memoNeeded === true,
        plainMemoSupported: memoOptions.some(option => option.hidden !== true)
      })
    )
  }

  /** Moves the memo the way `getMemoCarry` or a wallet switch decided. */
  function applyMemoCarry(carry: 'toTag' | 'toPlainMemo' | 'none'): void {
    const plainMemo = spendInfo.memos?.[0]?.value
    if (carry === 'toTag') setDestinationTag(plainMemo)
    if (carry === 'toPlainMemo' && destinationTag != null) {
      setSpendInfo({
        ...spendInfo,
        memos: [createEdgeMemo(memoOptions, destinationTag)]
      })
      setDestinationTag(undefined)
    }
  }

  /**
   * Flips the Stealth toggle, or refuses to, returning whether it moved.
   * Shared by a tap and by seeding, so an entry request or a saved choice gets
   * the same quote and memo handling as a tap.
   */
  const flipStealth = useHandler((): boolean => {
    if (multipleTargets) return false
    // No private route is possible for this asset, pair, or amount: refuse to
    // arm and say why, instead of arming a toggle whose quote is guaranteed to
    // fail. Turning it back OFF is always allowed.
    if (!stealth && stealthBlockedReason != null) {
      showToast(stealthBlockedReason)
      return false
    }
    // The standing quote was priced under the OTHER privacy setting, so it is
    // dead the moment the toggle moves. Drop it here rather than relying on
    // the re-quote effect to disable the slider a render later: the whole
    // point of the toggle is that a private send is never approved against a
    // transparent route, and the reverse.
    setSwapQuote(undefined)
    carryMemoAcrossModes(swapSendAllowed && (!stealth || crossAssetPicked))
    setStealth(value => !value)
    setPinValue(undefined)
    return true
  })

  /**
   * The toggle setting this visit asks for: the entry's `stealth` param while
   * there is one, then the user's last tap. `undefined` defers to the saved
   * choice.
   */
  const visitStealthRef = React.useRef<boolean | undefined>(stealthParam)

  /**
   * Only a tap the scene accepted becomes the account's saved choice. Seeding
   * goes through `flipStealth` directly and saves nothing, so an entry param
   * or deep link never changes what the user picked. The row stays locked
   * until the save lands, so a second tap cannot race it.
   */
  const handleToggleStealth = useHandler(async (): Promise<void> => {
    if (!flipStealth()) return
    visitStealthRef.current = !stealth
    await dispatch(setStealthSendEnabled(account, !stealth))
  })

  /**
   * Arms the toggle when the visit or the saved choice asks for it and a tap
   * would be accepted. Anywhere else it stays off with its reason, and the
   * saved choice is left for the next eligible wallet. Address-prefilled and
   * other constrained entries never offer the toggle, so nothing arms there.
   */
  const seedStealth = useHandler((): void => {
    if (stealth) {
      // Picking the source asset back can leave an armed toggle on an asset
      // with no private route to itself, or one whose quote already came back
      // without one. It turns off without saving, so it shows its reason and
      // arms again on the next pair that has a route:
      if (sameAsset && (!selfPrivateAvailable || pairCaps.stealth === false)) {
        flipStealth()
      }
      return
    }
    const wanted = visitStealthRef.current ?? stealthSendEnabled
    if (!wanted) return
    if (!swapSendAllowed || stealthBlockedReason != null) return
    flipStealth()
  })

  // The toggle seeds on mount, after a wallet or token change (flagged here
  // by the change; eligibility depends on the new pair, so the seed waits for
  // the render that has it), whenever the recipient asset changes by any path
  // (the picker, a detected or "Myself" destination, a cleared address), when
  // a swap-send becomes possible (the served Houdini list can land after the
  // mount seed found none), and when a blocked reason clears with nothing
  // else changing, as an amount raised past the private minimum does. One
  // effect, so a render doing two of these seeds once and cannot flip the
  // toggle back.
  const reseedStealthRef = React.useRef(true)
  const seededSwapSendAllowedRef = React.useRef(false)
  const seededBlockedRef = React.useRef(stealthBlockedReason != null)
  const pickedRecipientKey =
    pickedRecipientAsset == null
      ? undefined
      : recipientAssetKey(pickedRecipientAsset)
  const seededRecipientKeyRef = React.useRef(pickedRecipientKey)
  React.useEffect(() => {
    const becameAllowed = swapSendAllowed && !seededSwapSendAllowedRef.current
    seededSwapSendAllowedRef.current = swapSendAllowed
    const recipientChanged =
      pickedRecipientKey !== seededRecipientKeyRef.current
    seededRecipientKeyRef.current = pickedRecipientKey
    const becameUnblocked =
      stealthBlockedReason == null && seededBlockedRef.current
    seededBlockedRef.current = stealthBlockedReason != null
    if (
      !reseedStealthRef.current &&
      !becameAllowed &&
      !recipientChanged &&
      !becameUnblocked
    ) {
      return
    }
    reseedStealthRef.current = false
    seedStealth()
  }, [
    walletId,
    tokenId,
    pickedRecipientKey,
    swapSendAllowed,
    stealthBlockedReason,
    seedStealth
  ])

  const handlePickRecipientAsset = useHandler(async (): Promise<void> => {
    if (multipleTargets) return
    // Rows are keyed on the ASSET, never on its label: several chains share a
    // currency code (ETH on Base / Arbitrum / Ethereum) and a token can share
    // both name and code with a chain (the POL ERC-20 and Polygon), so a
    // label-keyed list marks the wrong rows selected and resolves either tap
    // to the same destination.
    const keyToChoice = new Map<string, RecipientAssetChoice>()
    const rows = getRecipientAssetChoices({
      source: { pluginId, tokenId },
      destinationAssets
    }).flatMap(choice => {
      const { asset } = choice
      const described = describeAsset(account, asset)
      if (described == null) return []
      const value = recipientAssetKey(asset)
      keyToChoice.set(value, choice)
      return [
        {
          value,
          name: described.assetName,
          network: sprintf(
            lstrings.stealth_recipient_network_1s,
            described.networkName
          ),
          currencyCode: described.currencyCode,
          icon: (
            <CryptoIcon
              pluginId={asset.pluginId}
              tokenId={asset.tokenId}
              sizeRem={1.5}
            />
          )
        }
      ]
    })

    await Airship.show<string | undefined>(bridge => (
      <RecipientAssetListModal
        bridge={bridge}
        title={lstrings.stealth_recipient_receives}
        searchPlaceholder={lstrings.search_assets}
        rows={rows}
      />
    ))
      .then(selected => {
        const choice = selected == null ? undefined : keyToChoice.get(selected)
        if (choice == null) return
        // Re-picking the asset already shown changes nothing:
        if (selected === recipientAssetKey(recipientAsset)) return
        const nextAsset = choice.pickedAsset
        if (
          pickKeepsRecipient({
            source: { pluginId, tokenId },
            destination: { pluginId: destPluginId, tokenId: destTokenId },
            picked: nextAsset
          })
        ) {
          // Another asset on the chain already selected is paid at the same
          // address, so the address and its tag stay. The quote and the
          // receive amount priced the previous asset, so both go. Picking the
          // source asset back ends the swap unless Stealth holds it:
          const nextCrossAsset =
            nextAsset != null &&
            (nextAsset.pluginId !== pluginId || nextAsset.tokenId !== tokenId)
          carryMemoAcrossModes(swapSendAllowed && (stealth || nextCrossAsset))
          setPickedRecipientAsset(nextAsset)
          setSwapQuote(undefined)
          setReceiveNativeAmount(undefined)
          setGuaranteedSide('send')
          setPinValue(undefined)
          return
        }
        // A new destination chain invalidates the entered address and tag, so
        // clear the whole recipient first. The reset drops the destination
        // asset too, which is why the new one is applied AFTER it: setting it
        // first would leave the reset's undefined as the last write.
        handleResetSendTransaction(spendInfo.spendTargets[0])()
        setPickedRecipientAsset(nextAsset)
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
  const handleEditYouSend = useHandler(async (): Promise<void> => {
    await Airship.show<FlipInputModalResult>(bridge => (
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

  const handleEditRecipientGets = useHandler(async (): Promise<void> => {
    if (destExchangeDenom == null) return
    // The pair is known to have no receive-priced route, so an exact receive
    // amount cannot be honored. Explain rather than opening an editor whose
    // value would immediately bounce back to the send side.
    if (pairCaps.fixedTo === false) {
      showToast(lstrings.stealth_fixed_to_unavailable_toast)
      return
    }
    if (destFlipWallet != null) {
      await Airship.show<FlipInputModalResult>(bridge => (
        <FlipInputModal2
          bridge={bridge}
          wallet={destFlipWallet}
          tokenId={destTokenId}
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
    await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        title={lstrings.stealth_recipient_gets}
        inputLabel={destCurrencyCode ?? ''}
        keyboardType="decimal-pad"
        initialValue={startAmount}
      />
    ))
      .then(amount => {
        if (amount == null || amount === '') return
        setReceiveNativeAmount(mul(amount, destExchangeDenom.multiplier))
        setSwapQuote(undefined)
        setGuaranteedSide('receive')
      })
      .catch((error: unknown) => {
        showError(error)
      })
  })

  const handleEditDestinationTag = useHandler(async (): Promise<void> => {
    await Airship.show<string | undefined>(bridge => (
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
    onPress: () => void | Promise<void>,
    fiat: SwapRowFiat | undefined,
    editDeactivated: boolean = false
  ): React.ReactElement => (
    <EdgeRow
      rightButtonType="editable"
      rightButtonDeactivated={editDeactivated}
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
      cryptoDisplayDenomination.name,
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
      destCurrencyCode ?? '',
      guaranteedSide === 'receive',
      handleEditRecipientGets,
      swapRowFiat(receiveNativeAmount, destCurrencyConfig, destTokenId),
      // The route cannot price from the receive side, so the editor is
      // unavailable. A tap still reaches the handler, which says why:
      pairCaps.fixedTo === false
    )
  }

  const renderRecipientReceives = (): React.ReactElement | null => {
    if (!swapSendAllowed) return null
    // A multi-recipient send always delivers the source asset, so the row
    // has nothing to offer there:
    if (multipleTargets) return null
    const described = describeAsset(account, recipientAsset)
    const recipientCurrencyCode = described?.currencyCode ?? currencyCode
    const recipientAssetName = described?.assetName ?? recipientCurrencyCode
    return (
      <EdgeRow
        rightButtonType="editable"
        title={lstrings.stealth_recipient_receives}
        onPress={handlePickRecipientAsset}
      >
        <View style={styles.swapAssetRow}>
          <CryptoIcon
            pluginId={recipientAsset.pluginId}
            tokenId={recipientAsset.tokenId}
            sizeRem={1.5}
            marginRem={[0, 0.5, 0, 0]}
          />
          <View style={styles.swapAssetText}>
            <EdgeText>{`${recipientAssetName} (${recipientCurrencyCode})`}</EdgeText>
            {described == null ? null : (
              <EdgeText style={styles.swapAssetNetwork}>
                {sprintf(
                  lstrings.stealth_recipient_network_1s,
                  described.networkName
                )}
              </EdgeText>
            )}
          </View>
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

    // Rate in exchange (standard) units, plus the shared price-delta
    // indicator:
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
    const priceImpact = calculateQuotePriceImpact(
      swapQuote,
      exchangeRates,
      defaultIsoFiat
    )

    return (
      <>
        <EdgeRow title={lstrings.stealth_quote_rate}>
          <EdgeText style={styles.swapAmountText}>
            {`1 ${currencyCode} = ${rate} ${destCurrencyCode ?? ''}`}
            <PriceImpactText priceImpact={priceImpact} />
          </EdgeText>
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
    // Stealth takes exactly one recipient, so the card is hidden while the
    // send has several. The toggle state is left alone, and the card returns
    // with it once the send is back to a single recipient:
    if (multipleTargets) return null
    // A toggle that cannot be armed shows dimmed and off with its reason
    // under it, on a plain send as much as on a swap. The row stays tappable
    // so a tap can toast the reason. Armed, a reason such as the private
    // minimum is left to the quote's error card instead:
    const blockedReason = stealth ? undefined : stealthBlockedReason
    return (
      <EdgeAnim enter={{ type: 'fadeInDown', distance: 40 }}>
        <EdgeCard sections>
          <SettingsSwitchRow
            label={lstrings.stealth_send_toggle}
            value={stealth}
            disabled={blockedReason != null}
            onPress={handleToggleStealth}
          />
          {blockedReason != null ? (
            <StealthInfoText message={blockedReason} />
          ) : stealth ? (
            <StealthInfoText
              message={sprintf(
                lstrings.stealth_info_1s,
                getStealthProviderName(account)
              )}
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
        <EdgeText>{`${totalDisplayAmount} ${cryptoDisplayDenomination.name}`}</EdgeText>
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
      lockTilesMap.amount === true ||
      // The existing target already claims the whole spendable balance, so a
      // second recipient could only ever be funded by shrinking it. Withhold
      // the entry point instead of silently discarding the max amount.
      maxSpendSetter >= 0
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
    // The quote's expiry is moot once a broadcast has been attempted with it.
    // Firing it now would either overwrite the locked-state card with an
    // expiry error or, for launchers whose onExpired navigates back, pop the
    // scene and hide the card entirely.
    if (broadcastAttemptedRef.current) return
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

  // The scene's warning area shows one card at a time: a shown error
  // supersedes the swap-send warnings below it.
  const showErrorCard =
    error != null && asMaybeNoAmountSpecifiedError(error) == null

  const renderError = (): React.ReactElement | null => {
    if (showErrorCard) return <ErrorCard error={error} />
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
          key={`${memoOption.type}:${memoOption.memoName}`}
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

  /**
   * The scam warning opens a plain send, until an address is entered. A
   * swap-send has its own warning card and an error stands alone, so the
   * scene never stacks this card on either.
   */
  const renderScamWarning = (): React.ReactElement | null => {
    if (swapSendActive || showErrorCard) return null
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
      'https://support.edge.app/en/articles/13892385-why-is-my-transaction-still-pending'
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
   * A send routed through a swap does not reach the recipient in this
   * transaction: the provider pays them in a second one, once the deposit
   * confirms. That wait is the part the scene does not otherwise show, so it
   * sits with the other warning cards for as long as the send stays a swap,
   * giving way only to an error.
   */
  const swapSendWarningBody = `${
    stealth
      ? lstrings.stealth_swap_send_warning_body_private
      : lstrings.stealth_swap_send_warning_body
  } ${lstrings.transaction_may_take_longer}`

  const renderSwapSendWarning = (): React.ReactElement | null => {
    if (!swapSendActive || showErrorCard) return null
    return (
      <EdgeAnim
        enter={{ type: 'fadeInUp', distance: 60 }}
        exit={{ type: 'fadeOutDown' }}
      >
        <AlertCardUi4
          type="warning"
          title={
            stealth
              ? lstrings.stealth_swap_send_warning_title_private
              : lstrings.stealth_swap_send_warning_title
          }
          body={swapSendWarningBody}
          marginRem={0.5}
        />
      </EdgeAnim>
    )
  }

  /**
   * The provider pays Zcash only to a transparent address, so a Stealth send
   * to a unified or shielded address lands on that wallet's t1 instead, in
   * the open. It is its own card because the fallback warning can replace
   * the swap warning, and this one has to stay through either.
   */
  const renderZcashTransparentWarning = (): React.ReactElement | null => {
    const shownAddress = spendInfo.spendTargets[0]?.publicAddress
    if (
      !swapSendActive ||
      !stealth ||
      destPluginId !== 'zcash' ||
      shownAddress == null ||
      shownAddress === '' ||
      destChain?.addressValidation.test(shownAddress) === true ||
      showErrorCard
    ) {
      return null
    }
    return (
      <EdgeAnim
        enter={{ type: 'fadeInUp', distance: 60 }}
        exit={{ type: 'fadeOutDown' }}
      >
        <AlertCardUi4
          type="warning"
          title={lstrings.stealth_zcash_transparent_payout_title}
          body={lstrings.stealth_zcash_transparent_payout_body}
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
      // Every exit below has to re-arm the slider. SafeSlider holds its spinner
      // and stays disabled until it is reset, so returning without one strands
      // the user on a spinner that never clears.
      //
      // The PIN spending limit gates BOTH submit paths, so it is checked
      // before either one: the swap-send branch below returns early, and a
      // swap-send has no `edgeTransaction`, so its null check sits below that
      // branch too.
      if (pinSpendingLimitsEnabled && spendingLimitExceeded) {
        let isAuthorized = false
        try {
          isAuthorized = await account.checkPin(pinValue ?? '')
        } catch (error: unknown) {
          resetSlider()
          showError(error)
          return
        }
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
        if (approvingSwapQuoteRef.current != null) return
        approvingSwapQuoteRef.current = liveQuote
        isSendingRef.current = true
        // `approve` signs and broadcasts inside the plugin, so the scene
        // cannot see the boundary the plain-send path locks at. Treat the
        // whole call as at or past it: a failure may still have put the
        // deposit on the network, and re-arming the slider would let a second
        // slide pay the order again.
        broadcastAttemptedRef.current = true
        try {
          const result = await liveQuote.approve()
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
          console.log(err)
          const errorCasted =
            err instanceof Error ? err : new Error(String(err))
          if (asMaybePendingFundsError(err) != null) {
            // The wallet refused the deposit before submitting it, the same
            // refusal the plain-send path re-arms on, so nothing was sent:
            broadcastAttemptedRef.current = false
            setSwapError(
              new I18nError(
                lstrings.transaction_failure,
                errorCasted.message !== ''
                  ? errorCasted.message
                  : lstrings.send_funds_not_spendable_error_message
              )
            )
          } else {
            logActivity(
              `Error during swap-send approve (${liveQuote.pluginId}): ${String(
                err
              )}`
            )
            // A rejection the engine names outright keeps its specific copy.
            // Anything else gets the same "status unknown" card as a failed
            // plain-send broadcast.
            setSwapError(
              DETERMINISTIC_REJECTIONS.has(errorCasted.name)
                ? describeSwapError(err)
                : new I18nError(
                    lstrings.send_broadcast_failure_title,
                    sprintf(
                      lstrings.send_broadcast_failure_message_s,
                      errorCasted.message
                    )
                  )
            )
            needsScrollToEnd.current = true
          }
        } finally {
          approvingSwapQuoteRef.current = undefined
          isSendingRef.current = false
          // Only the pre-submit refusal above re-arms the slider. Success
          // leaves it latched while the scene navigates away.
          if (broadcastAttemptedRef.current) {
            setBroadcastAttempted(true)
          } else {
            resetSlider()
          }
          if (closeAfterApprovalRef.current) {
            closeAfterApprovalRef.current = false
            closeSwapQuote(liveQuote)
          }
        }
        return
      }

      // EVM chains broadcast zero-amount transactions, which still spend gas.
      // Other chains disable the slider for zero amounts (unless allowZeroTx),
      // so this confirmation only surfaces for EVM coin and token sends.
      if (
        isEvmWallet(coreWallet) &&
        spendInfo.spendTargets.every(target => zeroString(target.nativeAmount))
      ) {
        const answer = await Airship.show<'continue' | 'cancel' | undefined>(
          bridge => (
            <ButtonsModal
              bridge={bridge}
              title={lstrings.send_confirmation_zero_amount_title}
              message={lstrings.send_confirmation_zero_amount_message}
              buttons={{
                continue: { label: lstrings.legacy_address_modal_continue },
                cancel: { label: lstrings.string_cancel_cap }
              }}
            />
          )
        )
        if (answer !== 'continue') {
          resetSlider()
          return
        }
      }

      if (edgeTransaction == null) {
        resetSlider()
        return
      }

      try {
        if (beforeTransaction != null) await beforeTransaction()
      } catch (e: unknown) {
        console.error(
          'Error from before transaction route param hook: ',
          String(e)
        )
        resetSlider()
        return
      }

      isSendingRef.current = true
      // Set once broadcastTx resolves, so the catch below can tell a broadcast
      // that reported failure apart from an error after a successful one.
      let broadcastSucceeded = false
      // Hoisted so the catch can log the real txid. For UTXO coins makeSpend
      // returns an empty txid and the engine only assigns it during signTx.
      let signedTx: EdgeTransaction | undefined
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

        signedTx = await coreWallet.signTx(edgeTransaction)

        // From this point on the transaction may reach the network, so lock
        // the slider for the life of this scene no matter what happens next.
        // The render-side flag is set in the finally block, so the slider
        // keeps its spinner while the attempt is in flight.
        broadcastAttemptedRef.current = true

        let broadcastedTx: EdgeTransaction
        if (alternateBroadcast != null) {
          broadcastedTx = await alternateBroadcast(signedTx)
        } else {
          broadcastedTx = await coreWallet.broadcastTx(signedTx)
        }
        broadcastSucceeded = true

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
        } else if (asMaybePendingFundsError(error) != null) {
          // A wallet that was spendable when the transaction was built can
          // still refuse it at broadcast, which the plugin reports this way.
          // The plugin's own text names the reason (syncing, rescanning,
          // repairing), so keep it and fall back only when it sent none.
          // The refusal happens before anything is submitted, so the
          // broadcast lock does not apply and the slider re-arms for a
          // retry once the wallet is spendable:
          broadcastAttemptedRef.current = false
          error = new I18nError(
            lstrings.transaction_failure,
            errorCasted.message !== ''
              ? errorCasted.message
              : lstrings.send_funds_not_spendable_error_message
          )
        }

        if (broadcastAttemptedRef.current) {
          // The broadcast was attempted, so the slider stays locked whatever
          // the cause. The copy is a separate decision: when the engine has
          // named a deterministic rejection above, the node refused the
          // transaction and that specific message stands, so the user learns
          // the real fix. Anything else at or after the boundary is ambiguous
          // and gets the honest "status unknown" card. That includes a 504,
          // which during a broadcast proves nothing either way.
          const txid = signedTx?.txid ?? edgeTransaction.txid
          logActivity(
            `Error ${
              broadcastSucceeded ? 'after' : 'during'
            } broadcastTx (txid ${txid}): ${String(err)}`
          )
          if (!DETERMINISTIC_REJECTIONS.has(errorCasted.name)) {
            error = new I18nError(
              lstrings.send_broadcast_failure_title,
              sprintf(
                broadcastSucceeded
                  ? lstrings.send_broadcast_post_error_message_s
                  : lstrings.send_broadcast_failure_message_s,
                errorCasted.message
              )
            )
          }
          setError(error)
          // The locked-state card is longer than a normal error and renders
          // last, above the docked slider. Scroll it into view so the whole
          // message is readable without scrolling by hand.
          needsScrollToEnd.current = true

          // Deliberately no onDone(error) here. The ramp launchers pop this
          // scene when their onDone promise rejects and show a generic
          // failure, which would hide this card and put the user back in a
          // flow that can start another real payment. They still terminate
          // through onBack when the user leaves, as on develop.
          return
        }

        setError(error)
      } finally {
        isSendingRef.current = false
        // The slider is idempotent once a broadcast has been attempted. Only a
        // failure before that boundary (PIN, hooks, FIO fee check, signing)
        // leaves the slider re-armed, because nothing could have been sent.
        if (broadcastAttemptedRef.current) {
          setBroadcastAttempted(true)
        } else {
          resetSlider()
        }
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
    // Retire any quote request still in flight, so its answer is closed
    // rather than stored on a scene that is gone:
    swapQuoteGeneration.current++
    if (onBack != null) onBack()
  })

  // Calculate the transaction
  useAsyncEffect(
    async () => {
      // Once a broadcast has been attempted the transaction may already be on
      // the network. Re-quoting would be meaningless, and the success path
      // below clears `error`, which is the only explanation the user has for
      // the locked slider. Freeze the quote instead. The amount handler has
      // already flagged "calculating" by the time we get here, so clear it
      // or the fee tile spins forever.
      if (broadcastAttemptedRef.current) {
        setProcessingAmountChanged(false)
        return
      }
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

        // A wallet whose balance exists but is not spendable yet reports it
        // this way, and the generic error card blames the network for it.
        // Ethereum's pending-transaction case is excluded because it has its
        // own warning card below:
        const pendingFundsError = isTxPending
          ? undefined
          : asMaybePendingFundsError(error)
        if (pendingFundsError != null) {
          error = new I18nError(
            lstrings.transaction_failure,
            pendingFundsError.message !== ''
              ? pendingFundsError.message
              : lstrings.send_funds_not_spendable_error_message
          )
        }

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

      // Frozen after an approve attempt, as the plain-send calculation is: a
      // re-quote would either arm a fresh order or retract the "status
      // unknown" card that explains the locked slider.
      if (broadcastAttemptedRef.current) {
        setFetchingSwapQuote(false)
        return
      }

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

      const disabledAsset = disableAssetsCover(
        swapDisableAssets.source,
        pluginId,
        tokenId
      )
        ? { currencyCode, networkName: coreWallet.currencyInfo.displayName }
        : disableAssetsCover(
            swapDisableAssets.destination,
            destPluginId,
            destTokenId
          )
        ? // A destination the account cannot describe is still banned:
          // name it by its ids rather than let the ban lapse.
          destDescription ?? {
            currencyCode: destTokenId ?? destPluginId,
            networkName: destCurrencyInfo?.chainDisplayName ?? destPluginId
          }
        : undefined
      if (disabledAsset != null) {
        setSwapQuote(undefined)
        setFetchingSwapQuote(false)
        // The message names the asset and the network it lives on. A token's
        // own name is not its network.
        setSwapError(
          new I18nError(
            lstrings.exchange_generic_error_title,
            sprintf(
              lstrings.swap_token_no_enabled_exchanges_2s,
              disabledAsset.currencyCode,
              disabledAsset.networkName
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
          makeSwapSendRequest({
            fromWallet: coreWallet,
            fromTokenId: tokenId,
            destination: { pluginId: destPluginId, tokenId: destTokenId },
            toAddress,
            walletAddresses: recipientWalletAddresses,
            toMemos,
            nativeAmount: quoteNativeAmount,
            guaranteedSide,
            stealth
          }),
          makeStealthSwapRequestOptions(account, {
            disabled: swapDisablePlugins
          })
        )
        const [quote, ...unusedQuotes] = quotes

        // The core keeps each swap-to-address quote's destination wallet
        // alive until the quote is closed, so every quote the scene will not
        // hold is closed here: the runners-up, and all of them when a newer
        // request has superseded this one.
        if (generation !== swapQuoteGeneration.current) {
          for (const unused of quotes) closeSwapQuote(unused)
          return
        }
        for (const unused of unusedQuotes) closeSwapQuote(unused)
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
            // toast that the recipient amount is no longer exact.
            markRouteCap('fixedTo')
            // Read the rates through the ref, not the closure. This effect
            // deliberately does not depend on `exchangeRates` (see its
            // dependency list), so the captured copy can predate a rate that
            // has since loaded.
            const { rates, isoFiat } = ratesRef.current
            const destRate = getExchangeRate(
              rates,
              destPluginId,
              destTokenId,
              isoFiat
            )
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
            // swap: turning it off degrades to a plain same-asset send, so do
            // that and say why.
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
      destTokenId,
      destinationTag,
      recipientWalletAddresses,
      swapDisablePlugins,
      swapDisableAssets,
      swapQuoteNonce
    ],
    'SendComponent:swapQuote'
  )

  // Mirror the quote into its ref, so a read that resumes after an await sees
  // the retirement rather than the value its render closed over. A quote the
  // scene retires, or still holds when it unmounts, is closed here, which is
  // what releases its destination wallet in the core.
  React.useEffect(() => {
    swapQuoteRef.current = swapQuote
    if (swapQuote == null) return
    return () => {
      if (approvingSwapQuoteRef.current === swapQuote) {
        closeAfterApprovalRef.current = true
        return
      }
      closeSwapQuote(swapQuote)
    }
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
      destTokenId,
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
    destTokenId,
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

  // Destructured rather than mutated so the gradient keeps its tuple type:
  // `LinearGradient` needs a compile-time guarantee of two or more stops.
  const [firstColor, ...restColors] = theme.assetBackgroundGradientColors
  const backgroundColors: GradientColors = [
    iconColor != null && theme.isDark
      ? darkenHexColor(iconColor, theme.assetBackgroundColorScale)
      : firstColor,
    ...restColors
  ]

  React.useEffect(() => {
    // Hack: While you would think to use InteractionManager.runAfterInteractions,
    // it doesn't work because several renders occur before the full height is
    // determined and the scrollToEnd call would be effective.
    const timeout = setTimeout(() => {
      if (needsScrollToEnd.current) {
        scrollViewRef.current?.scrollToEnd({ animated: true })
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
      // Docking the slider folds its measured height into the scene's bottom
      // inset, so the scroll content always ends above it:
      dockProps={
        showSlider
          ? {
              keyboardVisibleOnly: false,
              contentContainerStyle: styles.sliderDock,
              children: (
                <EdgeAnim enter={{ type: 'fadeInDown', distance: 120 }}>
                  <SafeSlider
                    disabledText={disabledText}
                    lockedText={
                      broadcastAttempted
                        ? lstrings.send_confirmation_slider_locked
                        : undefined
                    }
                    confirmText={
                      swapSendActive && stealth
                        ? lstrings.stealth_slide_send
                        : undefined
                    }
                    onSlidingComplete={handleSliderComplete}
                    disabled={disableSlider}
                  />
                </EdgeAnim>
              )
            }
          : undefined
      }
    >
      {({ insetStyle, undoInsetStyle }) => (
        // The scroll view runs under the dock, so only its content stops
        // short of the slider:
        <View style={{ ...undoInsetStyle, marginTop: 0 }}>
          <KeyboardAwareScrollView
            style={styles.keyboardAwareScrollView}
            ref={scrollViewRef}
            contentContainerStyle={{
              ...insetStyle,
              paddingTop: 0,
              paddingBottom: insetStyle.paddingBottom + theme.rem(0.5)
            }}
            // The docked slider rides the keyboard, so a focused field (the
            // PIN) has to clear it. This library sets the gap between the
            // focused input and the keyboard, whose height already includes
            // any toolbar above the keys. The hidden PIN input sits at the
            // bottom of its row, so the gap is the dock (in the bottom inset),
            // the card's padding and margin below the row, and the same
            // rem(0.5) the content keeps above the slider:
            bottomOffset={insetStyle.paddingBottom + theme.rem(2)}
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
            {renderSwapSendWarning()}
            {renderZcashTransparentWarning()}
            {renderNymWarning()}
            {renderError()}
            {sliderTopNode}
          </KeyboardAwareScrollView>
        </View>
      )}
    </SceneWrapper>
  )
}

export const SendScene2 = React.memo(SendComponent)

const getStyles = cacheStyles((theme: Theme) => ({
  keyboardAwareScrollView: {
    margin: theme.rem(0.5),
    marginBottom: 0
  },
  sliderDock: {
    alignItems: 'center',
    // Things close to the screen edge are hard to reach:
    paddingBottom: theme.rem(2)
  },
  calcFeeView: {
    flexDirection: 'row'
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
  swapAssetText: {
    flexShrink: 1
  },
  swapAssetNetwork: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75)
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
    // Hidden, but pinned to the bottom of the PIN row, because keyboard
    // avoidance lifts the focused input: this way it lifts the whole row.
    position: 'absolute',
    bottom: 0,
    width: 0,
    height: 0
  }
}))

/**
 * Closes a swap quote the scene no longer holds. A failure only means the
 * quote was already gone, which leaves the user nothing to act on.
 */
function closeSwapQuote(quote: EdgeSwapQuote): void {
  quote.close().catch((error: unknown) => {
    console.log(error)
  })
}

interface AssetDescription {
  currencyCode: string
  /**
   * The asset's own name. A chain's coin is not always named after the chain:
   * Optimism's coin is "Ethereum".
   */
  assetName: string
  /** The name of the chain the asset lives on. */
  networkName: string
}

/**
 * The names and currency code for an asset, or `undefined` when the account
 * has no plugin or token for it.
 */
function describeAsset(
  account: EdgeAccount,
  asset: EdgeAsset
): AssetDescription | undefined {
  const currencyConfig = account.currencyConfig[asset.pluginId]
  if (currencyConfig == null) return undefined
  const { assetDisplayName, chainDisplayName, currencyCode } =
    currencyConfig.currencyInfo
  if (asset.tokenId == null) {
    return {
      currencyCode,
      assetName: assetDisplayName,
      networkName: chainDisplayName
    }
  }
  const token = currencyConfig.allTokens[asset.tokenId]
  if (token == null) return undefined
  return {
    currencyCode: token.currencyCode,
    assetName: token.displayName,
    networkName: chainDisplayName
  }
}
