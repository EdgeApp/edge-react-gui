import { add, div, gte, lt, mul } from 'biggystring'
import {
  asMaybeInsufficientFundsError,
  asMaybeNoAmountSpecifiedError,
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeDenomination,
  EdgeSpendInfo,
  EdgeSpendTarget,
  EdgeTransaction
} from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Alert, TextInput, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { sprintf } from 'sprintf-js'

import { triggerScamWarningModal } from '../../actions/ScamWarningActions'
import { checkAndShowGetCryptoModal } from '../../actions/ScanActions'
import { playSendSound } from '../../actions/SoundActions'
import { FIO_STR, getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { useExchangeDenom } from '../../hooks/useExchangeDenom'
import { useHandler } from '../../hooks/useHandler'
import { useMount } from '../../hooks/useMount'
import { useUnmount } from '../../hooks/useUnmount'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useState } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { GuiExchangeRates } from '../../types/types'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { addToFioAddressCache, checkRecordSendFee, FIO_NO_BUNDLED_ERR_CODE, recordSend } from '../../util/FioAddressUtils'
import { logActivity } from '../../util/logger'
import { convertTransactionFeeToDisplayFee, DECIMAL_PRECISION } from '../../util/utils'
import { getMemoError, getMemoLabel, getMemoTitle } from '../../util/validateMemos'
import { WarningCard } from '../cards/WarningCard'
import { NotificationSceneWrapper } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { ButtonsModal } from '../modals/ButtonsModal'
import { FlipInputModal2, FlipInputModalRef, FlipInputModalResult } from '../modals/FlipInputModal2'
import { InsufficientFeesModal } from '../modals/InsufficientFeesModal'
import { TextInputModal } from '../modals/TextInputModal'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ExchangedFlipInputAmounts, ExchangeFlipInputFields } from '../themed/ExchangedFlipInput2'
import { PinDots } from '../themed/PinDots'
import { SafeSlider } from '../themed/SafeSlider'
import { SelectFioAddress2 } from '../themed/SelectFioAddress2'
import { AddressTile2, ChangeAddressResult } from '../tiles/AddressTile2'
import { CountdownTile } from '../tiles/CountdownTile'
import { EditableAmountTile } from '../tiles/EditableAmountTile'
import { ErrorTile } from '../tiles/ErrorTile'
import { Tile } from '../tiles/Tile'

interface Props extends EdgeSceneProps<'send2'> {}

export interface SendScene2Params {
  walletId: string
  tokenId?: string
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
  // fioAddress?: string // TODO: Implement specifying fio address
  // fioPendingRequest?: FioRequest // TODO: Implement specifying a fio payment request
  onBack?: () => void
  onDone?: (error: Error | null, edgeTransaction?: EdgeTransaction) => void
  beforeTransaction?: () => Promise<void>
  alternateBroadcast?: (edgeTransaction: EdgeTransaction) => Promise<EdgeTransaction>
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

// TODO: For now, do not allow multiple targets to be added via GUI. UX is very poor until
// animation is added. Waiting for reanimated v3 which fixes crashes in Layout animations.
// Note: multiple targets can be added via JSON payment protocol to fix payments to Anypay
// invoices.
const ALLOW_MULTIPLE_TARGETS = false

const PIN_MAX_LENGTH = 4
const INFINITY_STRING = '999999999999999999999999999999999999999'

const SendComponent = (props: Props) => {
  const { route, navigation } = props
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const makeSpendCounter = React.useRef<number>(0)

  const initialMount = React.useRef<boolean>(true)
  const pinInputRef = React.useRef<TextInput>(null)
  const flipInputModalRef = React.useRef<FlipInputModalRef>(null)
  const {
    walletId: initWalletId = '',
    tokenId: tokenIdProp,
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

  const initExpireDate = isoExpireDate != null ? new Date(isoExpireDate) : undefined
  const [processingAmountChanged, setProcessingAmountChanged] = React.useState<boolean>(false)
  const [walletId, setWalletId] = useState<string>(initWalletId)
  const [spendInfo, setSpendInfo] = useState<EdgeSpendInfo>(initSpendInfo ?? { spendTargets: [{}] })
  const [fieldChanged, setFieldChanged] = useState<ExchangeFlipInputFields>('fiat')
  const [feeNativeAmount, setFeeNativeAmount] = useState<string>('')
  const [minNativeAmount, setMinNativeAmount] = useState<string | undefined>(initMinNativeAmount)
  const [expireDate, setExpireDate] = useState<Date | undefined>(initExpireDate)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [edgeTransaction, setEdgeTransaction] = useState<EdgeTransaction | null>(null)
  const [pinValue, setPinValue] = useState<string | undefined>(undefined)
  const [spendingLimitExceeded, setSpendingLimitExceeded] = useState<boolean>(false)
  const [fioSender, setFioSender] = useState<FioSenderInfo>({
    fioAddress: '',
    fioWallet: null,
    fioError: '',
    memo: '',
    memoError: ''
  })

  // -1 = no max spend, otherwise equal to the index the spendTarget that requested the max spend.
  const [maxSpendSetter, setMaxSpendSetter] = useState<number>(-1)

  const account = useSelector<EdgeAccount>(state => state.core.account)
  const exchangeRates = useSelector<GuiExchangeRates>(state => state.exchangeRates)
  const pinSpendingLimitsEnabled = useSelector<boolean>(state => state.ui.settings.spendingLimits.transaction.isEnabled)
  const pinSpendingLimitsAmount = useSelector<number>(state => state.ui.settings.spendingLimits.transaction.amount ?? 0)
  const defaultIsoFiat = useSelector<string>(state => state.ui.settings.defaultIsoFiat)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const [tokenId, setTokenId] = useState<string | undefined>(spendInfo.tokenId ?? tokenIdProp)
  const coreWallet = currencyWallets[walletId]
  const { pluginId, memoOptions = [] } = coreWallet.currencyInfo
  const currencyCode = getCurrencyCode(coreWallet, tokenId)
  const cryptoDisplayDenomination = useDisplayDenom(pluginId, currencyCode)
  const cryptoExchangeDenomination = useExchangeDenom(pluginId, currencyCode)
  const parentDisplayDenom = useDisplayDenom(pluginId, currencyWallets[walletId].currencyInfo.currencyCode)
  const parentExchangeDenom = useExchangeDenom(pluginId, currencyWallets[walletId].currencyInfo.currencyCode)

  spendInfo.tokenId = tokenId

  // TODO: Fix currency plugins that implement getMaxSpendable to not look at the currencyCode
  // but the tokenId. Then we can remove the line below
  spendInfo.currencyCode = currencyCode

  if (initialMount.current) {
    if (hiddenFeaturesMap.scamWarning === false) {
      triggerScamWarningModal(account.disklet).catch(err => showError(err))
    }
    initialMount.current = false
  }

  const handleChangeAddress =
    (spendTarget: EdgeSpendTarget) =>
    async (changeAddressResult: ChangeAddressResult): Promise<void> => {
      const { parsedUri, fioAddress } = changeAddressResult

      if (parsedUri != null) {
        if (parsedUri.metadata != null) {
          spendInfo.metadata = parsedUri.metadata
        }
        spendTarget.uniqueIdentifier = parsedUri?.uniqueIdentifier
        spendTarget.publicAddress = parsedUri?.publicAddress
        spendTarget.nativeAmount = parsedUri?.nativeAmount
        spendTarget.otherParams = {
          fioAddress
        }

        // We can assume the spendTarget object came from the Component spendInfo so simply resetting the spendInfo
        // should properly re-render with new spendTargets
        setMinNativeAmount(parsedUri.minNativeAmount)
        setExpireDate(parsedUri?.expireDate)
        setSpendInfo({ ...spendInfo })
      }
    }

  const handleAddressAmountPress = (index: number) => () => {
    spendInfo.spendTargets.splice(index, 1)
    setSpendInfo({ ...spendInfo })
  }

  const renderAddressAmountTile = (index: number, spendTarget: EdgeSpendTarget) => {
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
        wallet={coreWallet}
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
  }

  const renderAddressTile = (index: number, spendTarget: EdgeSpendTarget) => {
    if (coreWallet != null && !hiddenFeaturesMap.address) {
      // TODO: Change API of AddressTile to access undefined recipientAddress
      const { publicAddress = '', otherParams = {} } = spendTarget
      const { fioAddress } = otherParams
      const title = lstrings.send_scene_send_to_address + (spendInfo.spendTargets.length > 1 ? ` ${(index + 1).toString()}` : '')
      return (
        <AddressTile2
          title={title}
          recipientAddress={publicAddress}
          coreWallet={coreWallet}
          currencyCode={currencyCode}
          onChangeAddress={handleChangeAddress(spendTarget)}
          resetSendTransaction={handleResetSendTransaction(spendTarget)}
          lockInputs={lockTilesMap.address}
          isCameraOpen={openCamera}
          fioToAddress={fioAddress}
          navigation={navigation}
        />
      )
    }

    return null
  }

  const handleAmountsChanged = (spendTarget: EdgeSpendTarget) => (amounts: ExchangedFlipInputAmounts) => {
    const { nativeAmount, fieldChanged: newField } = amounts
    spendTarget.nativeAmount = nativeAmount === '' ? undefined : nativeAmount

    // This works since the spendTarget object is guaranteed to be inside
    // the spendInfo object
    setProcessingAmountChanged(true)
    setSpendInfo({ ...spendInfo })
    setMaxSpendSetter(-1)
    setFieldChanged(newField)
  }

  const handleSetMax = (index: number) => () => {
    setMaxSpendSetter(index)
  }

  const handleFeesChange = useHandler(() => {
    if (coreWallet == null) return

    navigation.navigate('changeMiningFee2', {
      spendInfo,
      maxSpendSet: maxSpendSetter >= 0,
      wallet: coreWallet,
      onSubmit: (networkFeeOption, customNetworkFee) => {
        setSpendInfo({ ...spendInfo, networkFeeOption, customNetworkFee })
        setPinValue(undefined)
      }
    })
  })

  const handleFlipInputModal = (index: number, spendTarget: EdgeSpendTarget) => () => {
    Airship.show<FlipInputModalResult>(bridge => (
      <FlipInputModal2
        ref={flipInputModalRef}
        bridge={bridge}
        startNativeAmount={spendTarget.nativeAmount}
        forceField={fieldChanged}
        onAmountsChanged={handleAmountsChanged(spendTarget)}
        onMaxSet={handleSetMax(index)}
        onFeesChange={handleFeesChange}
        wallet={coreWallet}
        tokenId={tokenId}
        feeNativeAmount={feeNativeAmount}
      />
    ))
      .then(async () => {
        if (error == null) return
        console.log(error)
        const insufficientFunds = asMaybeInsufficientFundsError(error)
        if (insufficientFunds != null && insufficientFunds.currencyCode != null && spendInfo.currencyCode !== insufficientFunds.currencyCode) {
          await Airship.show(bridge => <InsufficientFeesModal bridge={bridge} coreError={insufficientFunds} navigation={navigation} wallet={coreWallet} />)
        }
      })
      .catch(error => showError(error))
  }

  const renderAmount = (index: number, spendTarget: EdgeSpendTarget) => {
    const { publicAddress, nativeAmount } = spendTarget
    if (publicAddress != null && !hiddenFeaturesMap.amount) {
      const title = lstrings.fio_request_amount + (spendInfo.spendTargets.length > 1 ? ` ${(index + 1).toString()}` : '')
      return (
        <EditableAmountTile
          title={title}
          exchangeRates={exchangeRates}
          nativeAmount={nativeAmount ?? ''}
          wallet={coreWallet}
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
    const out: Array<JSX.Element | null> = []
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
    Airship.show<WalletListResult>(bridge => <WalletListModal bridge={bridge} headerTitle={lstrings.fio_src_wallet} navigation={navigation} />)
      .then((result: WalletListResult) => {
        if (result.walletId == null || result.currencyCode == null) {
          return
        }
        setWalletId(result.walletId)
        const { pluginId: newPluginId } = currencyWallets[result.walletId].currencyInfo
        if (pluginId !== newPluginId || currencyCode !== result.currencyCode) {
          setTokenId(result.tokenId)
          setSpendInfo({ spendTargets: [{}] })
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
      <Tile
        type={lockTilesMap.wallet ? 'static' : 'editable'}
        title={lstrings.send_scene_send_from_wallet}
        onPress={lockTilesMap.wallet ? undefined : handleWalletPress}
        body={`${name} (${currencyCode})`}
      />
    )
  }

  const handleAddAddress = useHandler(() => {
    spendInfo.spendTargets.push({})
    setSpendInfo({ ...spendInfo })
  })

  const renderAddAddress = () => {
    const { pluginId } = coreWallet.currencyInfo
    const maxSpendTargets = getSpecialCurrencyInfo(pluginId)?.maxSpendTargets ?? 1
    if (maxSpendTargets < 2 || hiddenFeaturesMap.address || hiddenFeaturesMap.amount || lockTilesMap.address || lockTilesMap.amount) {
      return null
    }
    const numTargets = spendInfo.spendTargets.length
    const lastTargetHasAddress = spendInfo.spendTargets[numTargets - 1].publicAddress != null
    const lastTargetHasAmount = spendInfo.spendTargets[numTargets - 1].nativeAmount != null
    if (lastTargetHasAddress && lastTargetHasAmount && ALLOW_MULTIPLE_TARGETS) {
      return <Tile type="touchable" title={lstrings.send_add_destination_address} onPress={handleAddAddress} maximumHeight="small" contentPadding />
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
        contentPadding
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
    if (spendInfo.spendTargets[0].publicAddress != null) {
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
      const transactionFee = convertTransactionFeeToDisplayFee(coreWallet, exchangeRates, edgeTransaction, feeDisplayDenomination, feeExchangeDenomination)

      const fiatAmount = transactionFee.fiatAmount === '0' ? '0' : ` ${transactionFee.fiatAmount}`
      const feeSyntax = `${transactionFee.cryptoSymbol ?? ''} ${transactionFee.cryptoAmount} (${transactionFee.fiatSymbol ?? ''}${fiatAmount})`
      const feeSyntaxStyle = transactionFee.fiatStyle

      return (
        <Tile type={noChangeMiningFee || lockTilesMap.fee ? 'static' : 'touchable'} title={`${lstrings.string_fee}:`} onPress={handleFeesChange}>
          {processingAmountChanged ? (
            <View style={styles.calcFeeView}>
              <EdgeText
                style={{
                  // @ts-expect-error
                  color: feeSyntaxStyle ? theme[feeSyntaxStyle] : theme.primaryText
                }}
              >
                {lstrings.send_confirmation_calculating_fee}
              </EdgeText>

              <ActivityIndicator style={styles.calcFeeSpinner} />
            </View>
          ) : (
            <EdgeText
              style={{
                // @ts-expect-error
                color: feeSyntaxStyle ? theme[feeSyntaxStyle] : theme.primaryText
              }}
            >
              {feeSyntax}
            </EdgeText>
          )}
        </Tile>
      )
    }

    return null
  }

  const renderMetadataNotes = () => {
    const notes = edgeTransaction?.metadata?.notes
    if (notes != null) {
      return (
        <Tile type="static" title={lstrings.send_scene_metadata_name_title}>
          <EdgeText>{notes}</EdgeText>
        </Tile>
      )
    }
  }

  const handleFioAddressSelect = useHandler((fioAddress: string, fioWallet: EdgeCurrencyWallet, fioError: string) => {
    setFioSender({
      ...fioSender,
      fioAddress,
      fioWallet,
      fioError
    })
  })

  const handleMemoChange = useHandler((memo: string, memoError: string) => {
    setFioSender({
      ...fioSender,
      memo,
      memoError
    })
  })

  const renderSelectFioAddress = () => {
    if (hiddenFeaturesMap.fioAddressSelect) return null
    const fioTarget = spendInfo.spendTargets.some(target => target.otherParams?.fioAddress != null)
    return (
      <SelectFioAddress2
        navigation={navigation}
        selected={fioSender.fioAddress}
        memo={fioSender.memo}
        memoError={fioSender.memoError}
        onSelect={handleFioAddressSelect}
        onMemoChange={handleMemoChange}
        coreWallet={coreWallet}
        currencyCode={currencyCode}
        // fioRequest={fioPendingRequest}
        isSendUsingFioAddress={fioTarget}
      />
    )
  }

  // Only supports the first spendTarget that has a `memo` or `uniqueIdentifier`
  const renderUniqueIdentifier = () => {
    const spendTarget = spendInfo.spendTargets[0]
    const uniqueIdentifier = spendTarget?.memo ?? spendTarget?.uniqueIdentifier
    const [memoOption] = memoOptions.filter(option => option.hidden !== true)

    if (memoOption != null && spendTarget.publicAddress != null) {
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

      const handleUniqueIdentifier = async () => {
        await Airship.show<string | undefined>(bridge => (
          <TextInputModal
            bridge={bridge}
            initialValue={uniqueIdentifier}
            inputLabel={memoTitle}
            keyboardType={memoOption.type === 'number' ? 'numeric' : 'default'}
            maxLength={maxLength}
            message={sprintf(lstrings.unique_identifier_modal_description, memoLabel)}
            submitLabel={lstrings.unique_identifier_modal_confirm}
            title={memoTitle}
            onSubmit={async text =>
              getMemoError(
                {
                  type: memoOption.type,
                  memoName: memoOption.memoName,
                  value: text
                },
                memoOption
              ) ?? true
            }
          />
        )).then(newUniqueIdentifier => {
          if (newUniqueIdentifier == null) return
          // XXX Ugly hack. Put the uniqueIdentifier in the first spendTarget
          spendTarget.memo = spendTarget.uniqueIdentifier = newUniqueIdentifier
          setSpendInfo({ ...spendInfo })
        })
      }

      return (
        <Tile type="touchable" title={memoTitle} onPress={handleUniqueIdentifier}>
          <EdgeText>{uniqueIdentifier ?? addButtonText}</EdgeText>
        </Tile>
      )
    }

    return null
  }

  const handleFocusPin = useHandler(() => {
    pinInputRef.current?.focus()
  })

  const handleChangePin = useHandler((pin: string) => {
    setPinValue(pin)
    if (pin.length >= PIN_MAX_LENGTH && pinInputRef.current != null && pinInputRef.current.blur != null) {
      pinInputRef.current.blur()
    }
  })

  const renderInfoTiles = () => {
    if (!infoTiles || !infoTiles.length) return null
    return infoTiles.map(({ label, value }) => <Tile key={label} type="static" title={label} body={value} />)
  }

  const renderAuthentication = () => {
    if (!pinSpendingLimitsEnabled) return
    if (!spendingLimitExceeded) return

    const pinLength = pinValue?.length ?? 0
    return (
      <Tile type="touchable" title={lstrings.four_digit_pin} onPress={handleFocusPin}>
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
      </Tile>
    )
  }

  const renderScamWarning = () => {
    const { publicAddress } = spendInfo.spendTargets[0]

    if (publicAddress === '' || publicAddress == null) {
      const scamMessage = sprintf(lstrings.warning_scam_message_financial_advice_s, config.appName)
      const scamFooter = sprintf(lstrings.warning_scam_footer_s, config.supportEmail)

      return (
        <WarningCard
          title={lstrings.warning_scam_title}
          points={[scamMessage, lstrings.warning_scam_message_irreversibility, lstrings.warning_scam_message_unknown_recipients]}
          footer={scamFooter}
          marginRem={[1.5, 1]}
        />
      )
    }
    return null
  }

  const recordFioObtData = async (spendTarget: EdgeSpendTarget, currencyCode: string, txid: string) => {
    const { nativeAmount, publicAddress: payeePublicAddress = '', otherParams = {} } = spendTarget
    const { fioAddress: payeeFioAddress } = otherParams
    if (fioSender != null) {
      const { fioAddress: payerFioAddress, fioWallet, memo, skipRecord = false } = fioSender
      if (payeeFioAddress != null && payerFioAddress != null && fioWallet != null) {
        // if (guiMakeSpendInfo.fioPendingRequest != null) {
        // const { fioPendingRequest: pendingRequest } = guiMakeSpendInfo
        // try {
        //   await recordSend(fioWallet, fioAddress, {
        //     fioRequestId: pendingRequest.fio_request_id,
        //     payeeFioAddress: pendingRequest.payee_fio_address,
        //     payerPublicAddress: pendingRequest.payer_fio_public_key,
        //     payeePublicAddress: pendingRequest.content.payee_public_address,
        //     amount: pendingRequest.content.amount,
        //     currencyCode: pendingRequest.content.token_code.toUpperCase(),
        //     chainCode: pendingRequest.content.chain_code.toUpperCase(),
        //     txid: edgeSignedTransaction.txid,
        //     memo
        //   })
        // } catch (e: any) {
        //   const message = e?.message ?? ''
        //   message.includes(FIO_FEE_EXCEEDS_SUPPLIED_MAXIMUM) ? showError(lstrings.fio_fee_exceeds_supplied_maximum_record_obt_data) : showError(e)
        // }
        // } else if ((guiMakeSpendInfo.publicAddress != null || publicAddress != null) && (!skipRecord || edgeSignedTransaction.currencyCode === FIO_STR)) {
        if (!skipRecord) {
          const { publicAddress: payerPublicAddress } = await coreWallet.getReceiveAddress()
          const amount = nativeAmount ?? '0'
          const chainCode = coreWallet.currencyInfo.currencyCode

          await recordSend(fioWallet, payerFioAddress, {
            payeeFioAddress,
            payerPublicAddress,
            payeePublicAddress,
            amount: amount && div(amount, cryptoExchangeDenomination.multiplier, DECIMAL_PRECISION),
            currencyCode: currencyCode,
            chainCode,
            txid,
            memo
          })
        }
      }
    }
  }

  const handleSliderComplete = useHandler(async (resetSlider: () => void) => {
    // TODO:
    // 1. FIO functionality

    if (edgeTransaction == null) return
    if (pinSpendingLimitsEnabled && spendingLimitExceeded) {
      const isAuthorized = await account.checkPin(pinValue ?? '')
      if (!isAuthorized) {
        resetSlider()
        setPinValue('')
        showError(new Error(lstrings.incorrect_pin))
        return
      }
    }

    try {
      if (beforeTransaction != null) await beforeTransaction()
    } catch (e: any) {
      return
    }

    try {
      if (fioSender?.fioWallet != null && fioSender?.fioAddress != null) {
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
          const displayAmount = div(target.nativeAmount ?? '', cryptoDisplayDenomination.multiplier, DECIMAL_PRECISION)
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
        let fioNotes = `${lstrings.fragment_transaction_list_sent_prefix}${lstrings.fragment_send_from_label.toLowerCase()} ${fioSender.fioAddress}\n`
        fioNotes += fioSender.memo ? `\n${lstrings.fio_sender_memo_label}: ${fioSender.memo}\n` : ''
        if (notes.length > 1) {
          fioNotes += notes.join('\n')
        }
        broadcastedTx.metadata.notes = `${fioNotes}\n${broadcastedTx.metadata?.notes ?? ''}`
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

      logActivity(`broadcastTx: ${account.username} -- ${name ?? 'noname'} ${type} ${id}`)
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
        await recordFioObtData(target, currencyCode, broadcastedTx.txid).catch(error => showError(error))
      }

      playSendSound().catch(error => console.log(error)) // Fail quietly

      if (onDone) {
        navigation.pop()
        onDone(null, broadcastedTx)
      } else {
        navigation.replace('transactionDetails', {
          edgeTransaction: broadcastedTx,
          walletId
        })
      }
      Alert.alert(lstrings.transaction_success, lstrings.transaction_success_message, [
        {
          onPress() {},
          style: 'default',
          text: lstrings.string_ok
        }
      ])
    } catch (e: any) {
      resetSlider()
      console.log(e)
      let message = sprintf(lstrings.transaction_failure_message, e.message)
      e.message = 'broadcastError'
      if (e.name === 'ErrorEosInsufficientCpu') {
        message = lstrings.send_confirmation_eos_error_cpu
      } else if (e.name === 'ErrorEosInsufficientNet') {
        message = lstrings.send_confirmation_eos_error_net
      } else if (e.name === 'ErrorEosInsufficientRam') {
        message = lstrings.send_confirmation_eos_error_ram
      } else if (e.code && e.code === FIO_NO_BUNDLED_ERR_CODE && currencyCode !== FIO_STR) {
        const answer = await Airship.show<'ok' | 'cancel' | undefined>(bridge => (
          <ButtonsModal
            bridge={bridge}
            title={lstrings.fio_no_bundled_err_msg}
            message={`${lstrings.fio_no_bundled_non_fio_err_msg} ${lstrings.fio_no_bundled_add_err_msg}`}
            buttons={{
              ok: { label: lstrings.legacy_address_modal_continue },
              cancel: { label: lstrings.string_cancel_cap }
            }}
          />
        ))
        if (answer === 'ok') {
          // Retry the spend w/o FIO OBT data
          fioSender.skipRecord = true
          await handleSliderComplete(resetSlider)
          return
        }
      }

      Alert.alert(lstrings.transaction_failure, message, [
        {
          onPress() {},
          style: 'default',
          text: lstrings.string_ok
        }
      ])
    }
  })

  // Mount/Unmount life-cycle events:
  useMount(() => {
    if (doCheckAndShowGetCryptoModal) {
      dispatch(checkAndShowGetCryptoModal(navigation, route.params.walletId, route.params.spendInfo?.currencyCode)).catch(err => showError(err))
    }
  })
  useUnmount(() => {
    if (onBack != null) onBack()
  })

  // Calculate the transaction
  useAsyncEffect(async () => {
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
        flipInputModalRef.current?.setFees({ feeNativeAmount: '' })
      }
      if (pinSpendingLimitsEnabled) {
        const rate = exchangeRates[`${currencyCode}_${defaultIsoFiat}`] ?? INFINITY_STRING
        const totalNativeAmount = spendInfo.spendTargets.reduce((prev, target) => add(target.nativeAmount ?? '0', prev), '0')
        const totalExchangeAmount = div(totalNativeAmount, cryptoExchangeDenomination.multiplier, DECIMAL_PRECISION)
        const fiatAmount = mul(totalExchangeAmount, rate)
        const exceeded = gte(fiatAmount, pinSpendingLimitsAmount.toFixed(DECIMAL_PRECISION))
        setSpendingLimitExceeded(exceeded)
      }

      if (minNativeAmount != null) {
        for (const target of spendInfo.spendTargets) {
          if (target.nativeAmount == null) continue
          if (lt(target.nativeAmount, minNativeAmount)) {
            const minDisplayAmount = div(minNativeAmount, cryptoDisplayDenomination.multiplier, DECIMAL_PRECISION)
            const { name } = cryptoDisplayDenomination

            setError(new Error(sprintf(lstrings.error_spend_amount_less_then_min_s, `${minDisplayAmount} ${name}`)))
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
      const feeTokenId = parentNetworkFee == null ? tokenId : undefined
      setFeeNativeAmount(feeNativeAmount)
      flipInputModalRef.current?.setFees({ feeTokenId, feeNativeAmount })
      flipInputModalRef.current?.setError(null)
      setError(undefined)
    } catch (e: any) {
      setError(e)
      setEdgeTransaction(null)
      flipInputModalRef.current?.setError(e.message)
      flipInputModalRef.current?.setFees({ feeNativeAmount: '' })
    }
    setProcessingAmountChanged(false)
  }, [spendInfo, maxSpendSetter, walletId, pinSpendingLimitsEnabled, pinValue])

  const showSlider = spendInfo.spendTargets[0].publicAddress != null
  let disableSlider = false
  let disabledText: string | undefined

  if (edgeTransaction == null || processingAmountChanged || error != null) {
    disableSlider = true
  } else if (pinSpendingLimitsEnabled && spendingLimitExceeded && (pinValue?.length ?? 0) < PIN_MAX_LENGTH) {
    disableSlider = true
    disabledText = lstrings.spending_limits_enter_pin
  }
  return (
    <NotificationSceneWrapper navigation={navigation} background="theme">
      {(gap, notificationHeight) => (
        <>
          <StyledKeyboardAwareScrollView
            notificationHeight={notificationHeight}
            contentContainerStyle={{ paddingBottom: theme.rem(1) + notificationHeight }}
            extraScrollHeight={theme.rem(2.75)}
            enableOnAndroid
          >
            {renderSelectedWallet()}
            {renderAddressAmountPairs()}
            {renderAddAddress()}
            {renderTimeout()}
            {renderError()}
            {renderFees()}
            {renderMetadataNotes()}
            {renderSelectFioAddress()}
            {renderUniqueIdentifier()}
            {renderInfoTiles()}
            {renderAuthentication()}
            {renderScamWarning()}
          </StyledKeyboardAwareScrollView>
          <StyledSliderView notificationHeight={notificationHeight}>
            {showSlider && <SafeSlider disabledText={disabledText} onSlidingComplete={handleSliderComplete} disabled={disableSlider} />}
          </StyledSliderView>
        </>
      )}
    </NotificationSceneWrapper>
  )
}

const StyledKeyboardAwareScrollView = styled(KeyboardAwareScrollView)<{ notificationHeight: number }>(_theme => props => ({
  marginBottom: props.notificationHeight
}))

const StyledSliderView = styled(View)<{ notificationHeight: number }>(theme => props => {
  return {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: theme.rem(1) + props.notificationHeight
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
