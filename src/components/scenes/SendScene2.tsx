import { abs, add, div, gte, lt, lte, mul, sub } from 'biggystring'
import {
  asMaybeInsufficientFundsError,
  asMaybeNoAmountSpecifiedError,
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeDenomination,
  EdgeMemo,
  EdgeMemoOption,
  EdgeSpendInfo,
  EdgeSpendTarget,
  EdgeTokenId,
  EdgeTransaction,
  InsufficientFundsError
} from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, TextInput, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { sprintf } from 'sprintf-js'

import { showSendScamWarningModal } from '../../actions/ScamWarningActions'
import { checkAndShowGetCryptoModal } from '../../actions/ScanActions'
import { playSendSound } from '../../actions/SoundActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import {
  FIO_STR,
  getSpecialCurrencyInfo,
  SPECIAL_CURRENCY_INFO
} from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { useHandler } from '../../hooks/useHandler'
import { useIconColor } from '../../hooks/useIconColor'
import { useMount } from '../../hooks/useMount'
import { useUnmount } from '../../hooks/useUnmount'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { getExchangeDenom } from '../../selectors/DenominationSelectors'
import { config } from '../../theme/appConfig'
import { useState } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps, NavigationBase } from '../../types/routerTypes'
import { FioRequest, GuiExchangeRates } from '../../types/types'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import {
  addToFioAddressCache,
  checkRecordSendFee,
  FIO_FEE_EXCEEDS_SUPPLIED_MAXIMUM,
  FIO_NO_BUNDLED_ERR_CODE,
  recordSend
} from '../../util/FioAddressUtils'
import { logActivity } from '../../util/logger'
import {
  createEdgeMemo,
  getLegacyUniqueIdentifier,
  getMemoError,
  getMemoLabel,
  getMemoTitle
} from '../../util/memoUtils'
import {
  convertTransactionFeeToDisplayFee,
  darkenHexColor,
  DECIMAL_PRECISION,
  zeroString
} from '../../util/utils'
import { AlertCardUi4 } from '../cards/AlertCard'
import { EdgeCard } from '../cards/EdgeCard'
import { AccentColors } from '../common/DotsBackground'
import { EdgeAnim } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { ButtonsModal } from '../modals/ButtonsModal'
import {
  FlipInputModal2,
  FlipInputModalRef,
  FlipInputModalResult
} from '../modals/FlipInputModal2'
import { showInsufficientFeesModal } from '../modals/InsufficientFeesModal'
import { TextInputModal } from '../modals/TextInputModal'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { EdgeRow } from '../rows/EdgeRow'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import {
  ExchangedFlipInputAmounts,
  ExchangeFlipInputFields
} from '../themed/ExchangedFlipInput2'
import { PinDots } from '../themed/PinDots'
import { SafeSlider } from '../themed/SafeSlider'
import { SendFromFioRows } from '../themed/SendFromFioRows'
import {
  AddressEntryMethod,
  AddressTile2,
  ChangeAddressResult
} from '../tiles/AddressTile2'
import { CountdownTile } from '../tiles/CountdownTile'
import { EditableAmountTile } from '../tiles/EditableAmountTile'
import { ErrorTile } from '../tiles/ErrorTile'

// TODO: Check contentPadding

const SCROLL_TO_END_DELAY_MS = 150

interface Props extends EdgeAppSceneProps<'send2'> {}

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
  infoTiles?: Array<{ label: string; value: string }>
  fioPendingRequest?: FioRequest
  onBack?: () => void
  onDone?: (error: Error | null, edgeTransaction?: EdgeTransaction) => void
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

const SendComponent = (props: Props) => {
  const { route, navigation } = props
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const needsScrollToEnd = React.useRef<boolean>(false)
  const makeSpendCounter = React.useRef<number>(0)
  const scrollViewRef = React.useRef<KeyboardAwareScrollView | null>(null)

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
    lockTilesMap = {},
    hiddenFeaturesMap = {},
    onDone,
    onBack,
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
  const [error, setError] = useState<Error | undefined>(undefined)
  const [edgeTransaction, setEdgeTransaction] =
    useState<EdgeTransaction | null>(null)
  const [pinValue, setPinValue] = useState<string | undefined>(undefined)
  const [spendingLimitExceeded, setSpendingLimitExceeded] =
    useState<boolean>(false)
  const [lastAddressEntryMethod, setLastAddressEntryMethod] = useState<
    AddressEntryMethod | undefined
  >(undefined)
  const [fioSender, setFioSender] = useState<FioSenderInfo>({
    fioAddress: fioPendingRequest?.payer_fio_address ?? '',
    fioWallet: null,
    fioError: '',
    memo: fioPendingRequest?.content.memo ?? '',
    memoError: ''
  })

  // -1 = no max spend, otherwise equal to the index the spendTarget that requested the max spend.
  const [maxSpendSetter, setMaxSpendSetter] = useState<number>(-1)

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

  const currencyWallets = useWatch(account, 'currencyWallets')
  const coreWallet = currencyWallets[walletId]
  const { pluginId, memoOptions = [] } = coreWallet.currencyInfo

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

  if (initialMount.current) {
    if (hiddenFeaturesMap.scamWarning === false) {
      showSendScamWarningModal(account.disklet).catch(err => showError(err))
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

  const handleChangeAddress =
    (spendTarget: EdgeSpendTarget) =>
    async (changeAddressResult: ChangeAddressResult): Promise<void> => {
      const { addressEntryMethod, parsedUri, fioAddress } = changeAddressResult

      if (parsedUri != null) {
        if (parsedUri.metadata != null) {
          spendInfo.metadata = parsedUri.metadata
        }
        spendTarget.uniqueIdentifier = parsedUri?.uniqueIdentifier
        spendTarget.publicAddress = parsedUri?.publicAddress
        spendTarget.nativeAmount = parsedUri?.nativeAmount

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
          fioAddress
        }

        // We can assume the spendTarget object came from the Component spendInfo so simply resetting the spendInfo
        // should properly re-render with new spendTargets
        setLastAddressEntryMethod(addressEntryMethod)
        setMinNativeAmount(parsedUri.minNativeAmount)
        setExpireDate(parsedUri?.expireDate)
        setSpendInfo({ ...spendInfo, memos })
        needsScrollToEnd.current = true
      }
    }

  const handleAddressAmountPress = (index: number) => () => {
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
  ) => {
    const { publicAddress, nativeAmount, otherParams = {} } = spendTarget
    const { fioAddress } = otherParams
    let title = ''
    if (fioAddress != null) {
      title = `Send To (${fioAddress}) ${publicAddress}`
    } else {
      title = `Send To ${publicAddress}`
    }
    return (
      <EditableAmountTile
        title={title}
        exchangeRates={exchangeRates}
        nativeAmount={nativeAmount ?? ''}
        currencyCode={currencyCode}
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
    setError(undefined)
    setExpireDate(undefined)
    setPinValue(undefined)
    setSpendInfo({ ...spendInfo })
    // This is deleting the amount tile. If this happens, remove the
    // lastAddressEntryMethod so we don't auto launch the camera again.
    setLastAddressEntryMethod(undefined)
  }

  const renderAddressTile = (index: number, spendTarget: EdgeSpendTarget) => {
    if (coreWallet != null && !hiddenFeaturesMap.address) {
      // TODO: Change API of AddressTile to access undefined recipientAddress
      const { publicAddress = '', otherParams = {} } = spendTarget
      const { fioAddress } = otherParams
      const title =
        lstrings.send_scene_send_to_address +
        (spendInfo.spendTargets.length > 1 ? ` ${(index + 1).toString()}` : '')
      const doOpenCamera =
        openCameraRef.current ||
        (publicAddress === '' && lastAddressEntryMethod === 'scan')
      if (openCameraRef.current) openCameraRef.current = false

      return (
        <AddressTile2
          title={title}
          recipientAddress={publicAddress}
          coreWallet={coreWallet}
          currencyCode={currencyCode}
          onChangeAddress={handleChangeAddress(spendTarget)}
          resetSendTransaction={handleResetSendTransaction(spendTarget)}
          lockInputs={lockTilesMap.address}
          isCameraOpen={doOpenCamera}
          fioToAddress={fioAddress}
          navigation={navigation as NavigationBase}
        />
      )
    }

    return null
  }

  const handleAmountsChanged =
    (spendTarget: EdgeSpendTarget) => (amounts: ExchangedFlipInputAmounts) => {
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

  const handleFeesChange = useHandler(() => {
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
    (index: number, spendTarget: EdgeSpendTarget) => () => {
      const { noChangeMiningFee } = getSpecialCurrencyInfo(pluginId)
      Airship.show<FlipInputModalResult>(bridge => (
        <FlipInputModal2
          ref={flipInputModalRef}
          bridge={bridge}
          startNativeAmount={spendTarget.nativeAmount}
          feeTokenId={null}
          forceField={fieldChanged}
          onAmountsChanged={handleAmountsChanged(spendTarget)}
          onMaxSet={() => setMaxSpendSetter(index)}
          onFeesChange={noChangeMiningFee ? undefined : handleFeesChange}
          wallet={coreWallet}
          tokenId={tokenId}
          feeNativeAmount={feeNativeAmount}
        />
      ))
        .catch(error => showError(error))
        .finally(() => {
          const insufficientFunds = pendingInsufficientFees.current
          if (insufficientFunds != null) {
            pendingInsufficientFees.current = undefined
            showInsufficientFees(insufficientFunds).catch(error =>
              showError(error)
            )
          }
        })
    }

  const renderAmount = (index: number, spendTarget: EdgeSpendTarget) => {
    const { publicAddress, nativeAmount } = spendTarget
    if (publicAddress != null && !hiddenFeaturesMap.amount) {
      const title =
        lstrings.fio_request_amount +
        (spendInfo.spendTargets.length > 1 ? ` ${(index + 1).toString()}` : '')
      return (
        <EditableAmountTile
          title={title}
          exchangeRates={exchangeRates}
          nativeAmount={nativeAmount ?? ''}
          currencyCode={currencyCode}
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

  const renderAddressAmountPairs = () => {
    const out: Array<React.ReactElement | null> = []
    for (let i = 0; i < spendInfo.spendTargets.length; i++) {
      const spendTarget = spendInfo.spendTargets[i]
      let element
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

  const handleWalletPress = useHandler(() => {
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
        setWalletId(result.walletId)
        const { pluginId: newPluginId } =
          currencyWallets[result.walletId].currencyInfo
        if (pluginId !== newPluginId || tokenId !== result.tokenId) {
          setTokenId(result.tokenId)
          setSpendInfo({ tokenId: result.tokenId, spendTargets: [{}] })
        }
      })
      .catch(error => {
        showError(error)
        console.error(error)
      })
  })

  const renderSelectedWallet = () => {
    const name = coreWallet == null ? '' : getWalletName(coreWallet)

    return (
      <EdgeRow
        rightButtonType={lockTilesMap.wallet ? 'none' : 'editable'}
        title={lstrings.send_scene_send_from_wallet}
        onPress={lockTilesMap.wallet ? undefined : handleWalletPress}
        body={`${name} (${currencyCode})`}
      />
    )
  }

  const handleAddAddress = useHandler(() => {
    spendInfo.spendTargets.push({})
    setSpendInfo({ ...spendInfo })
    needsScrollToEnd.current = true
  })

  const renderAddAddress = () => {
    const { pluginId } = coreWallet.currencyInfo
    const maxSpendTargets =
      getSpecialCurrencyInfo(pluginId)?.maxSpendTargets ?? 1
    if (
      maxSpendTargets < 2 ||
      hiddenFeaturesMap.address ||
      hiddenFeaturesMap.amount ||
      lockTilesMap.address ||
      lockTilesMap.amount
    ) {
      return null
    }
    const numTargets = spendInfo.spendTargets.length
    const lastTargetHasAddress =
      spendInfo.spendTargets[numTargets - 1].publicAddress != null
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

  const handleTimeoutDone = useHandler(() => {
    setError(new Error(lstrings.send_address_expired_error_message))
  })

  const renderTimeout = () => {
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

  const renderError = () => {
    if (error && asMaybeNoAmountSpecifiedError(error) == null) {
      return <ErrorTile message={error.message} />
    }
    return null
  }

  const renderFees = () => {
    if (
      spendInfo.spendTargets[0].publicAddress != null &&
      spendInfo.spendTargets[0].nativeAmount != null
    ) {
      const { noChangeMiningFee } = getSpecialCurrencyInfo(pluginId)
      let feeDisplayDenomination: EdgeDenomination
      let feeExchangeDenomination: EdgeDenomination
      if (edgeTransaction?.parentNetworkFee != null) {
        feeDisplayDenomination = parentDisplayDenom
        feeExchangeDenomination = parentExchangeDenom
      } else {
        feeDisplayDenomination = cryptoDisplayDenomination
        feeExchangeDenomination = cryptoExchangeDenomination
      }
      const transactionFee = convertTransactionFeeToDisplayFee(
        coreWallet.currencyInfo.currencyCode,
        defaultIsoFiat,
        exchangeRates,
        edgeTransaction,
        feeDisplayDenomination,
        feeExchangeDenomination
      )

      const fiatAmount =
        transactionFee.fiatAmount === '0'
          ? '0'
          : ` ${transactionFee.fiatAmount}`
      const feeSyntax = `${transactionFee.cryptoSymbol ?? ''} ${
        transactionFee.cryptoAmount
      } (${transactionFee.fiatSymbol ?? ''}${fiatAmount})`
      const feeSyntaxStyle = transactionFee.fiatStyle

      return (
        <EdgeRow
          rightButtonType={
            noChangeMiningFee || lockTilesMap.fee ? 'none' : 'touchable'
          }
          title={`${lstrings.wc_smartcontract_network_fee}:`}
          onPress={noChangeMiningFee ? undefined : handleFeesChange}
        >
          {processingAmountChanged ? (
            <View style={styles.calcFeeView}>
              <EdgeText
                style={{
                  color: feeSyntaxStyle
                    ? // @ts-expect-error
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
                color: feeSyntaxStyle
                  ? // @ts-expect-error
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

  const renderMetadataNotes = () => {
    const notes = edgeTransaction?.metadata?.notes
    if (notes != null) {
      return (
        <EdgeRow title={lstrings.send_scene_metadata_name_title}>
          <EdgeText>{notes}</EdgeText>
        </EdgeRow>
      )
    }
  }

  const handleFioAddressSelect = useHandler(
    (fioAddress: string, fioWallet: EdgeCurrencyWallet, fioError: string) => {
      setFioSender({
        ...fioSender,
        fioAddress,
        fioWallet,
        fioError
      })
    }
  )

  const handleMemoChange = useHandler((memo: string, memoError: string) => {
    setFioSender({
      ...fioSender,
      memo,
      memoError
    })
  })

  const renderSelectFioAddress = () => {
    if (hiddenFeaturesMap.fioAddressSelect) return null
    const fioTarget = spendInfo.spendTargets.some(
      target => target.otherParams?.fioAddress != null
    )

    // HACK: CardUi4 somehow recognizes SelectFioAddress2 as a valid element
    // even when that component is returning null. Return null here instead so
    // the card can be properly hidden.
    if (fioPendingRequest == null && !fioTarget) return null

    return (
      <SendFromFioRows
        navigation={navigation as NavigationBase}
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

  const renderMemoOptions = () => {
    const spendTarget: EdgeSpendTarget | undefined = spendInfo.spendTargets[0]
    if (spendTarget == null || spendTarget.publicAddress == null) return null

    const renderOption = (memoOption: EdgeMemoOption, value: string = '') => {
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

      const handleMemo = async () => {
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
            onSubmit={async value =>
              getMemoError(
                {
                  type: memoOption.type,
                  memoName: memoOption.memoName,
                  value
                },
                memoOption
              ) ?? true
            }
          />
        )).then(value => {
          if (value == null) return
          if (spendInfo.memos == null) spendInfo.memos = []

          const edgeMemo: EdgeMemo = {
            type: memoOption.type,
            memoName: memoOption.memoName,
            value
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
    for (let i = 0; i < memoOptions.length; i++) {
      if (memoOptions[i].hidden) continue

      if (legacyUniqueIdentifier != null) {
        rows.push(renderOption(memoOptions[i], legacyUniqueIdentifier))
        legacyUniqueIdentifier = undefined
      } else {
        const memoValue =
          spendInfo?.memos?.find(memo => memo.type === memoOptions[i].type)
            ?.value ?? ''
        rows.push(renderOption(memoOptions[i], memoValue))
      }
    }
    return rows
  }

  const handleFocusPin = useHandler(() => {
    pinInputRef.current?.focus()
  })

  const handleChangePin = useHandler((pin: string) => {
    setPinValue(pin)
    if (
      pin.length >= PIN_MAX_LENGTH &&
      pinInputRef.current != null &&
      pinInputRef.current.blur != null
    ) {
      pinInputRef.current.blur()
    }
  })

  const renderInfoTiles = () => {
    if (!infoTiles || !infoTiles.length) return null
    return infoTiles.map(({ label, value }) => (
      <EdgeRow key={label} title={label} body={value} />
    ))
  }

  const renderAuthentication = () => {
    if (!pinSpendingLimitsEnabled) return
    if (!spendingLimitExceeded) return

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
        <TextInput
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

  const renderScamWarning = () => {
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

  const recordFioObtData = async (
    spendTarget: EdgeSpendTarget,
    currencyCode: string,
    txid: string
  ) => {
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
      } catch (e: any) {
        const message = String(e)
        message.includes(FIO_FEE_EXCEEDS_SUPPLIED_MAXIMUM)
          ? showError(lstrings.fio_fee_exceeds_supplied_maximum_record_obt_data)
          : showError(e)
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
      currencyCode: currencyCode,
      memo,
      payeeFioAddress,
      payeePublicAddress,
      payerPublicAddress: fioWallet.publicWalletInfo.keys.publicKey,
      txid
    })
  }

  const handleSliderComplete = useHandler(async (resetSlider: () => void) => {
    if (edgeTransaction == null) return
    if (pinSpendingLimitsEnabled && spendingLimitExceeded) {
      const isAuthorized = await account.checkPin(pinValue ?? '')
      if (!isAuthorized) {
        resetSlider()
        setPinValue('')
        showToast(lstrings.incorrect_pin)
        return
      }
    }

    try {
      if (beforeTransaction != null) await beforeTransaction()
    } catch (e: any) {
      return
    }

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

      // Figure out metadata
      let payeeName: string | undefined
      const notes: string[] = []
      const payeeFioAddresses: string[] = []
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

      if (broadcastedTx.metadata == null) {
        broadcastedTx.metadata = {}
      }
      if (broadcastedTx.metadata?.name == null) {
        broadcastedTx.metadata.name = payeeName
      }

      if (payeeName != null && fioSender != null) {
        let fioNotes = sprintf(
          `${lstrings.sent}\n`,
          `${lstrings.fragment_send_from_label.toLowerCase()} ${
            fioSender.fioAddress
          }`
        )
        fioNotes += fioSender.memo
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
        `broadcastTx: ${account.username} -- ${name ?? 'noname'} ${type} ${id}`
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

      for (const target of spendInfo.spendTargets) {
        // Write FIO OBT per spendTarget
        await recordFioObtData(target, currencyCode, broadcastedTx.txid).catch(
          error => showError(error)
        )
      }

      playSendSound().catch(error => console.log(error)) // Fail quietly

      if (onDone) {
        navigation.pop()
        onDone(null, broadcastedTx)
      } else {
        navigation.replace('transactionDetails', {
          edgeTransaction: broadcastedTx,
          walletId: coreWallet.id
        })
      }
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
    } catch (e: any) {
      resetSlider()
      console.log(e)
      let message = sprintf(lstrings.transaction_failure_message, e.message)
      e.message = 'broadcastError'
      if (e.name === 'ErrorAlgoRecipientNotActivated') {
        message = sprintf(
          lstrings.send_confirmation_algo_recipient_not_activated_s,
          currencyCode
        )
      }
      if (e.name === 'ErrorEosInsufficientCpu') {
        message = lstrings.send_confirmation_eos_error_cpu
      } else if (e.name === 'ErrorEosInsufficientNet') {
        message = lstrings.send_confirmation_eos_error_net
      } else if (e.name === 'ErrorEosInsufficientRam') {
        message = lstrings.send_confirmation_eos_error_ram
      } else if (
        e.code &&
        e.code === FIO_NO_BUNDLED_ERR_CODE &&
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
      } else if (message.includes('504')) {
        message = lstrings.transaction_failure_504_message
      }

      Airship.show<'ok' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={lstrings.transaction_failure}
          message={message}
          buttons={{
            ok: { label: lstrings.string_ok }
          }}
        />
      )).catch(() => {})
    }
  })

  // Mount/Unmount life-cycle events:
  useMount(() => {
    if (doCheckAndShowGetCryptoModal) {
      dispatch(
        checkAndShowGetCryptoModal(
          navigation as NavigationBase,
          coreWallet,
          tokenId
        )
      ).catch(err => showError(err))
    }
  })
  useUnmount(() => {
    if (onBack != null) onBack()
  })

  // Calculate the transaction
  useAsyncEffect(
    async () => {
      pendingInsufficientFees.current = undefined
      try {
        setProcessingAmountChanged(true)
        if (spendInfo.spendTargets[0].publicAddress == null) {
          setEdgeTransaction(null)
          setSpendingLimitExceeded(false)
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
        if (pinSpendingLimitsEnabled) {
          const rate =
            exchangeRates[`${currencyCode}_${defaultIsoFiat}`] ??
            INFINITY_STRING
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
          const exceeded = gte(
            fiatAmount,
            pinSpendingLimitsAmount.toFixed(DECIMAL_PRECISION)
          )
          setSpendingLimitExceeded(exceeded)
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
                new Error(
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
        setError(undefined)
      } catch (e: any) {
        const insufficientFunds = asMaybeInsufficientFundsError(e)
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
            e.message = sprintf(
              lstrings.insufficient_funds_2s,
              errorCurrencyCode,
              coreWallet.currencyInfo.displayName
            )
          } else {
            e.message = sprintf(
              lstrings.stake_error_insufficient_s,
              errorCurrencyCode
            )
          }

          if (spendInfo.tokenId !== insufficientFunds.tokenId) {
            // Show the modal if the flip input modal is closed or save it to show when it closes later
            if (flipInputModalRef.current != null) {
              pendingInsufficientFees.current = insufficientFunds
            } else {
              await showInsufficientFees(insufficientFunds).catch(error =>
                showError(error)
              )
            }
          }
        }

        if (
          e instanceof Error &&
          e.message === 'Unexpected pending transactions'
        ) {
          e.message = lstrings.unexpected_pending_transactions_error
        }

        setError(e)
        setEdgeTransaction(null)
        flipInputModalRef.current?.setError(e.message)
        flipInputModalRef.current?.setFees({
          feeNativeAmount: '',
          feeTokenId: null
        })
      }
      setProcessingAmountChanged(false)
    },
    [spendInfo, maxSpendSetter, walletId, pinSpendingLimitsEnabled, pinValue],
    'SendComponent'
  )

  const showSlider = spendInfo.spendTargets[0].publicAddress != null
  let disableSlider = false
  let disabledText: string | undefined

  if (
    edgeTransaction == null ||
    processingAmountChanged ||
    error != null ||
    (zeroString(spendInfo.spendTargets[0].nativeAmount) &&
      !SPECIAL_CURRENCY_INFO[pluginId].allowZeroTx)
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

  const accentColors: AccentColors = {
    // Transparent fallback for while iconColor is loading
    iconAccentColor: iconColor ?? '#00000000'
  }

  const backgroundColors = [...theme.assetBackgroundGradientColors]
  if (iconColor != null) {
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
    return () => clearTimeout(timeout)
  })

  return (
    <SceneWrapper
      hasNotifications
      accentColors={accentColors}
      padding={theme.rem(0.5)}
      backgroundGradientColors={backgroundColors}
      backgroundGradientEnd={theme.assetBackgroundGradientEnd}
      backgroundGradientStart={theme.assetBackgroundGradientStart}
      overrideDots={theme.backgroundDots.assetOverrideDots}
    >
      {({ insetStyle }) => (
        <>
          <StyledKeyboardAwareScrollView
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
              </EdgeCard>
            </EdgeAnim>
            <EdgeAnim enter={{ type: 'fadeInUp', distance: 40 }}>
              <EdgeCard sections>
                {renderAddressAmountPairs()}
                {renderTimeout()}
                {renderError()}
              </EdgeCard>
            </EdgeAnim>
            <EdgeAnim enter={{ type: 'fadeInDown', distance: 40 }}>
              <EdgeCard sections>{renderAddAddress()}</EdgeCard>
            </EdgeAnim>
            <EdgeAnim enter={{ type: 'fadeInDown', distance: 40 }}>
              <EdgeCard sections>
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
          </StyledKeyboardAwareScrollView>
          <StyledSliderView
            hasNotifications={hasNotifications}
            insetBottom={insetStyle.paddingBottom}
          >
            {showSlider && (
              <EdgeAnim enter={{ type: 'fadeInDown', distance: 120 }}>
                <SafeSlider
                  disabledText={disabledText}
                  onSlidingComplete={handleSliderComplete}
                  disabled={disableSlider}
                />
              </EdgeAnim>
            )}
          </StyledSliderView>
        </>
      )}
    </SceneWrapper>
  )
}

const StyledKeyboardAwareScrollView = styled(KeyboardAwareScrollView)(
  theme => ({
    margin: theme.rem(0.5),
    marginBottom: 0
  })
)

const StyledSliderView = styled(View)<{
  insetBottom: number
  hasNotifications: boolean
}>(theme => props => {
  const { insetBottom, hasNotifications } = props

  // We only need a bit more room under the slider when it's against the bottom
  // edge of the screen to improve usability - things close to the edges of the
  // screen are hard to access.
  // We don't need this extra space when notifications push the slider up away
  // from the bottom edge, so reduce the bottom margins in this case.
  const bottom = insetBottom + (hasNotifications ? theme.rem(1) : theme.rem(2))

  return {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom
  }
})

export const SendScene2 = React.memo(SendComponent)

const getStyles = cacheStyles((theme: Theme) => ({
  calcFeeView: {
    flexDirection: 'row'
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
