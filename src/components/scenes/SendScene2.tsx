import { add, div, gte, mul } from 'biggystring'
import {
  asMaybeInsufficientFundsError,
  asMaybeNoAmountSpecifiedError,
  EdgeAccount,
  EdgeDenomination,
  EdgeSpendInfo,
  EdgeSpendTarget,
  EdgeTransaction
} from 'edge-core-js'
import * as React from 'react'
import { Alert, TextInput, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { sprintf } from 'sprintf-js'

import { selectWalletForExchange } from '../../actions/CryptoExchangeActions'
import { playSendSound } from '../../actions/SoundActions'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { useExchangeDenom } from '../../hooks/useExchangeDenom'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import s from '../../locales/strings'
import { useState } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { Actions, NavigationProp, RouteProp } from '../../types/routerTypes'
import { GuiExchangeRates } from '../../types/types'
import { getCurrencyCode, getTokenId } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { logActivity } from '../../util/logger'
import { convertTransactionFeeToDisplayFee, DECIMAL_PRECISION, roundedFee } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { FlipInputModal2, FlipInputModalRef, FlipInputModalResult } from '../modals/FlipInputModal2'
import { TextInputModal } from '../modals/TextInputModal'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ExchangedFlipInputAmounts, ExchangeFlipInputFields } from '../themed/ExchangedFlipInput2'
import { PinDots } from '../themed/PinDots'
import { SafeSlider } from '../themed/SafeSlider'
import { AddressTile, ChangeAddressResult } from '../tiles/AddressTile'
import { EditableAmountTile } from '../tiles/EditableAmountTile'
import { ErrorTile } from '../tiles/ErrorTile'
import { Tile } from '../tiles/Tile'

type Props = {
  navigation: NavigationProp<'send2'>
  route: RouteProp<'send2'>
}

const PIN_MAX_LENGTH = 4
const INFINITY_STRING = '999999999999999999999999999999999999999'

const SendComponent = React.memo((props: Props) => {
  const { route, navigation } = props
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const pinInputRef = React.useRef<TextInput>(null)
  const flipInputModalRef = React.useRef<FlipInputModalRef>(null)
  const {
    walletId: initWalletId = '',
    tokenId: tokenIdProp,
    spendInfo: initSpendInfo,
    openCamera,
    allowedCurrencyCodes,
    lockTilesMap = {},
    hiddenTilesMap = {}
  } = route.params

  const [walletId, setWalletId] = useState<string>(initWalletId)
  const [spendInfo, setSpendInfo] = useState<EdgeSpendInfo>(initSpendInfo ?? { spendTargets: [{}] })
  const [fieldChanged, setFieldChanged] = useState<ExchangeFlipInputFields>('fiat')
  const [feeNativeAmount, setFeeNativeAmount] = useState<string>('')
  const [error, setError] = useState<Error | undefined>(undefined)
  const [edgeTransaction, setEdgeTransaction] = useState<EdgeTransaction | null>(null)
  const [pinValue, setPinValue] = useState<string | undefined>(undefined)
  const [spendingLimitExceeded, setSpendingLimitExceeded] = useState<boolean>(false)

  // 0 = no max spend. 1 and higher = the spendTarget that requested the max spend. 1 = 1st, 2 = 2nd ...
  const [maxSpendSetter, setMaxSpendSetter] = useState<number>(0)
  console.log(edgeTransaction?.currencyCode ?? '')

  const account = useSelector<EdgeAccount>(state => state.core.account)
  const exchangeRates = useSelector<GuiExchangeRates>(state => state.exchangeRates)
  const pinSpendingLimitsEnabled = useSelector<boolean>(state => state.ui.settings.spendingLimits.transaction.isEnabled)
  const pinSpendingLimitsAmount = useSelector<number>(state => state.ui.settings.spendingLimits.transaction.amount)
  const defaultIsoFiat = useSelector<string>(state => state.ui.settings.defaultIsoFiat)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const [currencyCode, setCurrencyCode] = useState<string>(spendInfo?.currencyCode ?? currencyWallets[walletId].currencyInfo.currencyCode)
  const { pluginId } = currencyWallets[walletId].currencyInfo
  const cryptoDisplayDenomination = useDisplayDenom(pluginId, currencyCode)
  const cryptoExchangeDenomination = useExchangeDenom(pluginId, currencyCode)
  const parentDisplayDenom = useDisplayDenom(pluginId, currencyWallets[walletId].currencyInfo.currencyCode)
  const parentExchangeDenom = useExchangeDenom(pluginId, currencyWallets[walletId].currencyInfo.currencyCode)
  const coreWallet = currencyWallets[walletId]

  const tokenId = tokenIdProp ?? getTokenId(account, pluginId, currencyCode)
  spendInfo.currencyCode = getCurrencyCode(coreWallet, tokenId)

  const handleChangeAddress = useHandler((spendTarget: EdgeSpendTarget) => async (changeAddressResult: ChangeAddressResult): Promise<void> => {
    spendTarget.publicAddress = changeAddressResult.parsedUri?.publicAddress ?? ''

    // We can assume the spendTarget object came from the Component spendInfo so simply resetting the spendInfo
    // should properly re-render with new spendTargets
    setSpendInfo({ ...spendInfo })
  })

  const handleAddressAmountPress = useHandler((index: number) => () => {
    spendInfo.spendTargets.splice(index, 1)
    setSpendInfo({ ...spendInfo })
  })

  const renderAddressAmountTile = useHandler((index: number, spendTarget: EdgeSpendTarget) => {
    const { publicAddress, nativeAmount } = spendTarget
    return (
      <EditableAmountTile
        title={`Send To ${publicAddress}`}
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
  })

  const handleResetSendTransaction = useHandler((spendTarget: EdgeSpendTarget) => () => {
    spendTarget.publicAddress = undefined
    spendTarget.nativeAmount = undefined
    spendTarget.memo = spendTarget.uniqueIdentifier = undefined
    setPinValue(undefined)
    setSpendInfo({ ...spendInfo })
  })

  const renderAddressTile = useHandler((index: number, spendTarget: EdgeSpendTarget) => {
    if (coreWallet != null && !hiddenTilesMap.address) {
      // TODO: Change API of AddressTile to access undefined recipientAddress
      const { publicAddress = '' } = spendTarget
      const title = s.strings.send_scene_send_to_address + (spendInfo.spendTargets.length > 1 ? ` ${(index + 1).toString()}` : '')
      return (
        <AddressTile
          title={title}
          recipientAddress={publicAddress}
          coreWallet={coreWallet}
          currencyCode={currencyCode}
          onChangeAddress={handleChangeAddress(spendTarget)}
          resetSendTransaction={handleResetSendTransaction(spendTarget)}
          lockInputs={lockTilesMap.address}
          isCameraOpen={!!openCamera}
          ref={() => {}}
        />
      )
    }

    return null
  })

  const handleAmountsChanged = useHandler((spendTarget: EdgeSpendTarget) => (amounts: ExchangedFlipInputAmounts) => {
    const { nativeAmount, fieldChanged: newField } = amounts
    spendTarget.nativeAmount = nativeAmount === '' ? undefined : nativeAmount

    // This works since the spendTarget object is guaranteed to be inside
    // the spendInfo object
    setSpendInfo({ ...spendInfo })
    setMaxSpendSetter(0)
    setFieldChanged(newField)
  })

  const handleSetMax = useHandler((index: number) => () => {
    setMaxSpendSetter(index)
  })

  const handleFeesChange = useHandler(() => {
    if (coreWallet == null) return

    navigation.navigate('changeMiningFee2', {
      spendInfo,
      maxSpendSet: maxSpendSetter > 0,
      wallet: coreWallet,
      onSubmit: (networkFeeOption, customNetworkFee) => {
        setSpendInfo({ ...spendInfo, networkFeeOption, customNetworkFee })
        setMaxSpendSetter(0)
        setPinValue(undefined)
      }
    })
  })

  const handleFlipInputModal = useHandler((index: number, spendTarget: EdgeSpendTarget) => () => {
    Airship.show<FlipInputModalResult>(bridge => (
      <FlipInputModal2
        ref={flipInputModalRef}
        bridge={bridge}
        startNativeAmount={spendTarget.nativeAmount}
        forceField={fieldChanged}
        onAmountsChanged={handleAmountsChanged(spendTarget)}
        onMaxSet={handleSetMax(index + 1)}
        onFeesChange={handleFeesChange}
        walletId={walletId}
        tokenId={tokenId}
        feeNativeAmount={feeNativeAmount}
      />
    ))
      .then(async () => {
        if (error == null) return
        console.log(error)
        const insufficientFunds = asMaybeInsufficientFundsError(error)
        if (insufficientFunds != null && insufficientFunds.currencyCode != null && spendInfo.currencyCode !== insufficientFunds.currencyCode) {
          const { currencyCode, networkFee = '' } = insufficientFunds
          const multiplier = cryptoDisplayDenomination.multiplier
          const amountString = roundedFee(networkFee, 2, multiplier)
          const result = await Airship.show<'buy' | 'exchange' | 'cancel' | undefined>(bridge => (
            <ButtonsModal
              bridge={bridge}
              title={s.strings.buy_crypto_modal_title}
              message={`${amountString}${sprintf(s.strings.buy_parent_crypto_modal_message, currencyCode)}`}
              buttons={{
                buy: { label: sprintf(s.strings.buy_crypto_modal_buy_action, currencyCode) },
                exchange: { label: s.strings.buy_crypto_modal_exchange, type: 'primary' },
                cancel: { label: s.strings.buy_crypto_decline }
              }}
            />
          ))
          switch (result) {
            case 'buy':
              Actions.jump('pluginListBuy', { direction: 'buy' })
              return
            case 'exchange':
              dispatch(selectWalletForExchange(walletId, currencyCode, 'to'))
              Actions.jump('exchangeScene', {})
              break
          }
        }
      })
      .catch(error => console.log(error))
  })

  const renderAmount = useHandler((index: number, spendTarget: EdgeSpendTarget) => {
    const { publicAddress, nativeAmount } = spendTarget
    if (publicAddress != null && !hiddenTilesMap.amount) {
      const title = s.strings.fio_request_amount + (spendInfo.spendTargets.length > 1 ? ` ${(index + 1).toString()}` : '')
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
  })

  const renderAddressAmountPairs = useHandler(() => {
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
  })

  const handleWalletPress = useHandler(() => {
    Airship.show<WalletListResult>(bridge => (
      <WalletListModal bridge={bridge} headerTitle={s.strings.fio_src_wallet} allowedCurrencyCodes={allowedCurrencyCodes} />
    ))
      .then((result: WalletListResult) => {
        if (result.walletId == null || result.currencyCode == null) {
          return
        }
        setWalletId(result.walletId)
        const { pluginId: newPluginId } = currencyWallets[result.walletId].currencyInfo
        if (pluginId !== newPluginId || currencyCode !== result.currencyCode) {
          setCurrencyCode(result.currencyCode)
          setSpendInfo({ spendTargets: [{}] })
        }
      })
      .catch(error => console.log(error))
  })

  const renderSelectedWallet = useHandler(() => {
    const name = coreWallet == null ? '' : getWalletName(coreWallet)

    return (
      <Tile
        type={lockTilesMap.wallet ? 'static' : 'editable'}
        title={s.strings.send_scene_send_from_wallet}
        onPress={lockTilesMap.wallet ? undefined : handleWalletPress}
        body={`${name} (${currencyCode})`}
      />
    )
  })

  const handleAddAddress = useHandler(() => {
    spendInfo.spendTargets.push({})
    setSpendInfo({ ...spendInfo })
  })

  const renderAddAddress = useHandler(() => {
    const type = coreWallet.type
    const maxSpendTargets = getSpecialCurrencyInfo(type)?.maxSpendTargets ?? 1
    if (maxSpendTargets < 2 || hiddenTilesMap.address || hiddenTilesMap.amount || lockTilesMap.address || lockTilesMap.amount) {
      return null
    }
    const numTargets = spendInfo.spendTargets.length
    const lastTargetHasAddress = spendInfo.spendTargets[numTargets - 1].publicAddress != null
    const lastTargetHasAmount = spendInfo.spendTargets[numTargets - 1].nativeAmount != null
    if (lastTargetHasAddress && lastTargetHasAmount) {
      return <Tile type="touchable" title={s.strings.send_add_destination_address} onPress={handleAddAddress} maximumHeight="small" contentPadding />
    } else {
      return null
    }
  })

  const renderError = useHandler(() => {
    if (error && asMaybeNoAmountSpecifiedError(error) == null) {
      return <ErrorTile message={error.message} />
    }
    return null
  })

  const renderFees = useHandler(() => {
    if (edgeTransaction != null) {
      const { noChangeMiningFee } = getSpecialCurrencyInfo(pluginId)
      let feeDisplayDenomination: EdgeDenomination
      let feeExchangeDenomination: EdgeDenomination
      if (edgeTransaction.parentNetworkFee != null) {
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
        <Tile type={noChangeMiningFee ? 'static' : 'touchable'} title={`${s.strings.string_fee}:`} onPress={handleFeesChange}>
          <EdgeText
            style={{
              // @ts-expect-error
              color: feeSyntaxStyle ? theme[feeSyntaxStyle] : theme.primaryText
            }}
          >
            {feeSyntax}
          </EdgeText>
        </Tile>
      )
    }

    return null
  })

  const renderMetadataNotes = useHandler(() => {
    const notes = edgeTransaction?.metadata?.notes
    if (notes != null) {
      return (
        <Tile type="static" title={s.strings.send_scene_metadata_name_title}>
          <EdgeText>{notes}</EdgeText>
        </Tile>
      )
    }
  })

  // Only supports the first spendTarget that has a `memo` or `uniqueIdentifier`
  const renderUniqueIdentifier = useHandler(() => {
    const spendTarget = spendInfo.spendTargets[0]
    const uniqueIdentifier = spendTarget?.memo ?? spendTarget?.uniqueIdentifier
    const { uniqueIdentifierInfo } = getSpecialCurrencyInfo(coreWallet.currencyInfo.pluginId)

    if (uniqueIdentifierInfo != null && spendTarget.publicAddress != null) {
      const { addButtonText, identifierName, keyboardType } = uniqueIdentifierInfo

      const handleUniqueIdentifier = () => {
        Airship.show<string | undefined>(bridge => (
          <TextInputModal
            bridge={bridge}
            inputLabel={identifierName}
            initialValue={uniqueIdentifier}
            keyboardType={keyboardType}
            message={sprintf(s.strings.unique_identifier_modal_description, identifierName)}
            submitLabel={s.strings.unique_identifier_modal_confirm}
            title={identifierName}
            maxLength={coreWallet?.currencyInfo?.memoMaxLength}
          />
        )).then(newUniqueIdentifier => {
          if (newUniqueIdentifier == null) return
          // XXX Ugly hack. Put the uniqueIdentifier in the first spendTarget
          spendTarget.memo = spendTarget.uniqueIdentifier = newUniqueIdentifier
          setSpendInfo({ ...spendInfo })
        })
      }

      return (
        <Tile type="touchable" title={identifierName} onPress={handleUniqueIdentifier}>
          <EdgeText>{uniqueIdentifier ?? addButtonText}</EdgeText>
        </Tile>
      )
    }

    return null
  })

  const handleFocusPin = useHandler(() => {
    pinInputRef.current?.focus()
  })

  const handleChangePin = useHandler((pin: string) => {
    setPinValue(pin)
    if (pin.length >= PIN_MAX_LENGTH && pinInputRef.current != null && pinInputRef.current.blur != null) {
      pinInputRef.current.blur()
    }
  })

  const renderAuthentication = useHandler(() => {
    if (!pinSpendingLimitsEnabled) return
    if (!spendingLimitExceeded) return

    const pinLength = pinValue?.length ?? 0
    return (
      <Tile type="touchable" title={s.strings.four_digit_pin} onPress={handleFocusPin}>
        <View style={styles.pinContainer}>
          <PinDots pinLength={pinLength} maxLength={PIN_MAX_LENGTH} />
        </View>
        <TextInput
          ref={pinInputRef}
          maxLength={PIN_MAX_LENGTH}
          onChangeText={handleChangePin}
          keyboardType="numeric"
          returnKeyType="done"
          placeholder={s.strings.spending_limits_enter_pin}
          placeholderTextColor={theme.textLink}
          style={styles.pinInput}
          value={pinValue}
          secureTextEntry
        />
      </Tile>
    )
  })

  const handleSliderComplete = async (resetSlider: () => void) => {
    // TODO:
    // 1. FIO functionality
    // 2. onBack
    // 3. onDone
    // 4. beforeTransaction
    // 5. alternateBroadcast

    if (edgeTransaction == null) return
    if (pinSpendingLimitsEnabled && spendingLimitExceeded) {
      const isAuthorized = await account.checkPin(pinValue ?? '')
      if (!isAuthorized) {
        resetSlider()
        setPinValue('')
        showError(new Error(s.strings.incorrect_pin))
        return
      }
    }
    try {
      const signedTx = await coreWallet.signTx(edgeTransaction)
      const broadcastedTx = await coreWallet.broadcastTx(signedTx)

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
      playSendSound().catch(error => console.log(error)) // Fail quietly
      Alert.alert(s.strings.transaction_success, s.strings.transaction_success_message, [
        {
          onPress() {},
          style: 'default',
          text: s.strings.string_ok
        }
      ])

      Actions.replace('transactionDetails', {
        edgeTransaction: signedTx
      })
    } catch (e: any) {
      resetSlider()
      console.log(e)
      let message = sprintf(s.strings.transaction_failure_message, e.message)
      e.message = 'broadcastError'
      if (e.name === 'ErrorEosInsufficientCpu') {
        message = s.strings.send_confirmation_eos_error_cpu
      } else if (e.name === 'ErrorEosInsufficientNet') {
        message = s.strings.send_confirmation_eos_error_net
      } else if (e.name === 'ErrorEosInsufficientRam') {
        message = s.strings.send_confirmation_eos_error_ram
      }

      Alert.alert(s.strings.transaction_failure, message, [
        {
          onPress() {},
          style: 'default',
          text: s.strings.string_ok
        }
      ])
    }
  }

  // Calculate the transaction
  useAsyncEffect(async () => {
    try {
      if (pinSpendingLimitsEnabled) {
        const rate = exchangeRates[`${currencyCode}_${defaultIsoFiat}`] ?? INFINITY_STRING
        const totalNativeAmount = spendInfo.spendTargets.reduce((prev, target) => add(target.nativeAmount ?? '0', prev), '0')
        const totalExchangeAmount = div(totalNativeAmount, cryptoExchangeDenomination.multiplier, DECIMAL_PRECISION)
        const fiatAmount = mul(totalExchangeAmount, rate)
        const exceeded = gte(fiatAmount, pinSpendingLimitsAmount.toFixed(DECIMAL_PRECISION))
        setSpendingLimitExceeded(exceeded)
      }

      if (spendInfo.spendTargets[0].publicAddress == null) {
        setEdgeTransaction(null)
        return
      }
      if (maxSpendSetter === 1) {
        const maxSpendable = await coreWallet.getMaxSpendable(spendInfo)
        spendInfo.spendTargets[0].nativeAmount = maxSpendable
      }
      if (spendInfo.spendTargets[0].nativeAmount == null) {
        flipInputModalRef.current?.setFees({ feeNativeAmount: '' })
        return
      }
      const edgeTx = await coreWallet.makeSpend(spendInfo)
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
  }, [spendInfo, maxSpendSetter, walletId, pinSpendingLimitsEnabled, pinValue])

  const showSlider = spendInfo.spendTargets[0].publicAddress != null
  let disableSlider = false
  let disabledText: string | undefined

  if (edgeTransaction == null) {
    disableSlider = true
  } else if (pinSpendingLimitsEnabled && spendingLimitExceeded && (pinValue?.length ?? 0) < PIN_MAX_LENGTH) {
    disableSlider = true
    disabledText = s.strings.spending_limits_enter_pin
  }
  return (
    <SceneWrapper background="theme">
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        {renderSelectedWallet()}
        {renderAddressAmountPairs()}
        {renderAddAddress()}
        {renderError()}
        {renderFees()}
        {renderMetadataNotes()}
        {renderUniqueIdentifier()}
        {renderAuthentication()}
        <View style={styles.footer}>
          {showSlider && <SafeSlider disabledText={disabledText} onSlidingComplete={handleSliderComplete} disabled={disableSlider} />}
        </View>
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
})

export const SendScene2 = React.memo(SendComponent)

const getStyles = cacheStyles((theme: Theme) => ({
  footer: {
    margin: theme.rem(2),
    justifyContent: 'center',
    alignItems: 'center'
  },
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
