/* eslint-disable react-native/no-raw-text */

import { div, log10, toFixed } from 'biggystring'
import * as React from 'react'
import { memo, useState } from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import { sprintf } from 'sprintf-js'

import { MINIMUM_DEVICE_HEIGHT } from '../../constants/constantSettings'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { formatNumber } from '../../locales/intl'
import s from '../../locales/strings'
import { deviceHeight } from '../../theme/variables/platform'
import { useSelector } from '../../types/reactRedux'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { DECIMAL_PRECISION } from '../../util/utils'
import { Card } from '../cards/Card'
import { ExchangeRate2 } from '../common/ExchangeRate2'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { FiatText } from '../text/FiatText'
import { EdgeText } from '../themed/EdgeText'
import { ExchangedFlipInput2, ExchangedFlipInputAmounts, ExchangedFlipInputRef, ExchangeFlipInputFields } from '../themed/ExchangedFlipInput2'
import { MiniButton } from '../themed/MiniButton'
import { ThemedModal } from '../themed/ThemedModal'

export type FlipInputModalResult = {
  nativeAmount: string
  exchangeAmount: string
}

export interface SetFeesParams {
  feeTokenId?: string
  feeNativeAmount: string
}
export interface FlipInputModalRef {
  setFees: (params: SetFeesParams) => void
  setAmount: (field: ExchangeFlipInputFields, value: string) => void
  setError: (errorMessage: string | null) => void
}

type FeeStyleTypes = 'dangerText' | 'warningText'

type Props = {
  bridge: AirshipBridge<FlipInputModalResult>
  walletId: string
  tokenId?: string
  startNativeAmount?: string
  forceField?: ExchangeFlipInputFields
  // Fees
  feeTokenId?: string
  feeNativeAmount?: string
  feeStyle?: FeeStyleTypes
  onFeesChange?: () => void
  onMaxSet?: () => void
  onAmountsChanged?: (amounts: ExchangedFlipInputAmounts) => void
  headerText?: string
  hideMaxButton?: boolean
}

const FlipInputModal2Component = React.forwardRef<FlipInputModalRef, Props>((props: Props, ref) => {
  const {
    bridge,
    walletId,
    tokenId,
    startNativeAmount,
    forceField,
    onAmountsChanged,
    feeTokenId: startingFeeTokenId,
    feeNativeAmount: startingFeeNativeAmount = '',
    feeStyle,
    onFeesChange,
    onMaxSet,
    headerText,
    hideMaxButton
  } = props

  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const [feeTokenId, setFeeTokenId] = useState<string | undefined>(startingFeeTokenId)
  const [feeNativeAmount, setFeeNativeAmount] = useState<string>(startingFeeNativeAmount)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const wallet = currencyWallets[walletId]
  const { currencyInfo } = wallet
  const balances = useWatch(wallet, 'balances')
  const { pluginId } = currencyInfo
  const currencyCode = getCurrencyCode(wallet, tokenId)
  const displayDenom = useDisplayDenom(pluginId, currencyCode)
  const exchangedFlipInputRef = React.useRef<ExchangedFlipInputRef>(null)
  const feeCurrencyCode = getCurrencyCode(wallet, feeTokenId)
  const feeDisplayDenom = useDisplayDenom(pluginId, feeCurrencyCode)

  const [amounts, setAmounts] = useState<ExchangedFlipInputAmounts>({
    nativeAmount: '',
    exchangeAmount: '',
    fiatAmount: '',
    fieldChanged: forceField ?? 'fiat'
  })

  const walletName = wallet?.name ?? s.strings.string_no_name
  const flipInputHeaderText = headerText ?? sprintf(s.strings.send_from_wallet, walletName)
  const theme = useTheme()
  const styles = getStyles(theme)

  const handleAmountsChanged = useHandler((amounts: ExchangedFlipInputAmounts) => {
    setAmounts(amounts)

    if (onAmountsChanged) onAmountsChanged(amounts)
  })

  const handleFeesChange = useHandler(() => {
    if (onFeesChange != null) {
      handleCloseModal()
      onFeesChange()
    }
  })

  const handleCloseModal = useHandler(() => {
    let { nativeAmount, exchangeAmount, fiatAmount } = amounts
    nativeAmount = nativeAmount === '' ? '0' : nativeAmount
    exchangeAmount = exchangeAmount === '' ? '0' : exchangeAmount
    fiatAmount = fiatAmount === '' ? '0' : fiatAmount
    bridge.resolve(Promise.resolve({ nativeAmount, exchangeAmount, fiatAmount }))
  })

  const handleSendMaxAmount = useHandler(() => {
    if (onMaxSet != null) {
      onMaxSet()
      handleCloseModal()
    }
  })

  const renderErrorMessage = useHandler(() => {
    const opacity = errorMessage == null ? 0 : 1
    return (
      <EdgeText numberOfLines={1} style={[styles.exchangeRateErrorText, { opacity }]}>
        {errorMessage == null ? ' ' : errorMessage.split('\n')[0]}
      </EdgeText>
    )
  })

  const renderExchangeRates = useHandler(() => {
    return (
      <View style={styles.rateBalanceContainer}>
        <EdgeText style={styles.secondaryTitle}>{s.strings.string_rate}</EdgeText>
        <ExchangeRate2 wallet={wallet} tokenId={tokenId} style={styles.rateBalanceText} />
      </View>
    )
  })

  const renderBalance = useHandler(() => {
    const { multiplier, name } = displayDenom
    const balanceCrypto = balances[currencyCode] ?? '0'
    const balance = `${formatNumber(div(balanceCrypto, multiplier, DECIMAL_PRECISION))} ${name} `
    return (
      <View style={styles.rateBalanceContainer}>
        <EdgeText style={styles.secondaryTitle}>{s.strings.send_confirmation_balance}</EdgeText>
        <EdgeText style={styles.rateBalanceText}>
          {balance}
          (
          <FiatText wallet={wallet} tokenId={tokenId} nativeCryptoAmount={balanceCrypto} />)
        </EdgeText>
      </View>
    )
  })

  const renderFees = useHandler(() => {
    const feeDisplayAmountTemp = div(feeNativeAmount, feeDisplayDenom.multiplier, DECIMAL_PRECISION)
    const feeDisplayAmount = toFixed(feeDisplayAmountTemp, 0, log10(feeDisplayDenom.multiplier))

    const feeCryptoText = `${feeDisplayAmount} ${feeDisplayDenom.name} `
    const feeTextStyle = feeStyle === 'dangerText' ? styles.feeTextDanger : feeStyle === 'warningText' ? styles.feeTextWarning : styles.feeTextDefault

    return (
      <View style={styles.feeContainer}>
        <View style={styles.feeTitleContainer}>
          <EdgeText style={styles.primaryTitle}>{s.strings.string_fee}</EdgeText>
          {onFeesChange ? <FontAwesomeIcon name="edit" style={styles.feeIcon} size={theme.rem(0.75)} /> : null}
        </View>
        <EdgeText style={feeTextStyle}>
          {feeCryptoText}
          (<FiatText nativeCryptoAmount={feeNativeAmount} wallet={wallet} />)
        </EdgeText>
      </View>
    )
  })

  const renderFlipInput = useHandler(() => {
    return (
      <Card>
        <ExchangedFlipInput2
          ref={exchangedFlipInputRef}
          walletId={walletId}
          tokenId={tokenId}
          startNativeAmount={startNativeAmount}
          forceField={amounts.fieldChanged}
          headerText={flipInputHeaderText}
          onAmountChanged={handleAmountsChanged}
          keyboardVisible
          onNext={handleCloseModal}
        />
        {getSpecialCurrencyInfo(pluginId).noMaxSpend !== true && hideMaxButton !== true ? (
          <MiniButton alignSelf="center" label={s.strings.string_max_cap} marginRem={[1.2, 0, 0]} onPress={handleSendMaxAmount} />
        ) : null}
      </Card>
    )
  })

  React.useImperativeHandle(ref, () => ({
    setFees: (params: SetFeesParams) => {
      setFeeTokenId(params.feeTokenId)
      setFeeNativeAmount(params.feeNativeAmount)
    },
    setAmount: (field: ExchangeFlipInputFields, value: string) => exchangedFlipInputRef.current?.setAmount(field, value),
    setError: (errorMessage: string | null) => setErrorMessage(errorMessage)
  }))

  return (
    <ThemedModal bridge={bridge} onCancel={handleCloseModal}>
      {/* Extra view needed here to fullscreen the modal on small devices */}
      <View style={styles.hackContainer}>
        <View style={styles.flipInput}>{renderFlipInput()}</View>
        <TouchableWithoutFeedback onPress={handleFeesChange} style={styles.content}>
          <View>
            {renderFees()}
            {renderExchangeRates()}
            {renderBalance()}
            {renderErrorMessage()}
          </View>
        </TouchableWithoutFeedback>
      </View>
    </ThemedModal>
  )
})

export const FlipInputModal2 = memo(FlipInputModal2Component)

const getStyles = cacheStyles((theme: Theme) => ({
  hackContainer: {
    flex: deviceHeight <= MINIMUM_DEVICE_HEIGHT ? 1 : 0
  },
  flipInput: {
    justifyContent: 'flex-start'
  },
  content: {
    justifyContent: 'flex-end'
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerMaxAmountText: {
    color: theme.textLink
  },
  primaryTitle: {
    color: theme.secondaryText
  },
  secondaryTitle: {
    flex: 1,
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  rateBalanceContainer: {
    flexDirection: 'row'
  },
  exchangeRateErrorText: {
    fontSize: theme.rem(0.75),
    color: theme.dangerText
  },
  rateBalanceText: {
    fontSize: theme.rem(0.75)
  },
  feeContainer: {
    flexDirection: 'row',
    marginTop: theme.rem(0.5),
    marginBottom: theme.rem(1)
  },
  feeTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  feeTextDefault: {
    color: theme.primaryText
  },
  feeTextWarning: {
    color: theme.warningText
  },
  feeTextDanger: {
    color: theme.dangerText
  },
  feeIcon: {
    color: theme.iconTappable,
    marginLeft: theme.rem(0.5)
  }
}))
