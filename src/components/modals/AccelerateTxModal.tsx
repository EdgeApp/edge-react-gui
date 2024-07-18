import { abs, lt, sub } from 'biggystring'
import { EdgeCurrencyWallet, EdgeDenomination, EdgeTransaction } from 'edge-core-js'
import React, { PureComponent } from 'react'
import { Text, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { lstrings } from '../../locales/strings'
import { getExchangeDenom, selectDisplayDenom } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { GuiExchangeRates } from '../../types/types'
import { convertTransactionFeeToDisplayFee } from '../../util/utils'
import { WarningCard } from '../cards/WarningCard'
import { EdgeRow } from '../rows/EdgeRow'
import { cacheStyles, Theme, ThemeProps, useTheme } from '../services/ThemeContext'
import { Paragraph } from '../themed/EdgeText'
import { Slider } from '../themed/Slider'
import { EdgeModal } from './EdgeModal'

interface OwnProps {
  acceleratedTx: EdgeTransaction
  bridge: AirshipBridge<EdgeTransaction | null>
  replacedTx: EdgeTransaction
  wallet: EdgeCurrencyWallet
}
interface StateProps {
  exchangeRates: GuiExchangeRates
  isoFiatCurrencyCode: string
  feeDisplayDenomination: EdgeDenomination
}
type Props = OwnProps & StateProps & ThemeProps

interface State {
  error?: Error
  status: 'confirming' | 'sending' | 'sent'
  mounted: boolean
}

export class AccelerateTxModalComponent extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      error: undefined,
      status: 'confirming',
      mounted: true
    }
  }

  signBroadcastAndSave = async () => {
    const { acceleratedTx, wallet } = this.props

    this.setState({ status: 'sending' })

    try {
      // Sign, broadcast, and save the accelerated transaction
      const signedTx = await wallet.signTx(acceleratedTx)
      await wallet.broadcastTx(signedTx)
      await wallet.saveTx(signedTx)

      if (this.state.mounted) {
        this.setState({ status: 'sent' })
      }
      this.closeModal(signedTx)
    } catch (error: any) {
      if (this.state.mounted) {
        this.closeModal(null, error)
      }
    }
  }

  closeModal = (signedTx: EdgeTransaction | null, err?: Error) => {
    this.setState({
      mounted: false
    })
    if (err != null) this.props.bridge.reject(err)
    else this.props.bridge.resolve(signedTx)
  }

  handleCancel = () => {
    this.closeModal(null)
  }

  handleConfirmation = async () => {
    await this.signBroadcastAndSave()
  }

  getTxFeeDisplay = (edgeTransaction: EdgeTransaction): string => {
    const { exchangeRates, feeDisplayDenomination, wallet, isoFiatCurrencyCode } = this.props

    const feeDefaultDenomination = getExchangeDenom(wallet.currencyConfig, null)
    const transactionFee = convertTransactionFeeToDisplayFee(
      wallet.currencyInfo.currencyCode,
      isoFiatCurrencyCode,
      exchangeRates,
      edgeTransaction,
      feeDisplayDenomination,
      feeDefaultDenomination
    )

    const feeSyntax = `${transactionFee.cryptoSymbol ?? ''} ${transactionFee.cryptoAmount} (${transactionFee.fiatSymbol ?? ''} ${transactionFee.fiatAmount})`

    return feeSyntax
  }

  render() {
    const { acceleratedTx, bridge, replacedTx, theme } = this.props
    const { error, status } = this.state

    const styles = getStyles(theme)

    const oldFee = this.getTxFeeDisplay(replacedTx)
    const newFee = this.getTxFeeDisplay(acceleratedTx)

    const isLowerAmount = lt(getTxSendAmount(acceleratedTx), getTxSendAmount(replacedTx))
    const isSending = status === 'sending'

    return (
      <EdgeModal bridge={bridge} onCancel={this.handleCancel} title={lstrings.transaction_details_accelerate_transaction_header}>
        <Paragraph>{lstrings.transaction_details_accelerate_transaction_instructional}</Paragraph>
        <View style={styles.container}>
          <EdgeRow title={lstrings.transaction_details_accelerate_transaction_old_fee_title} body={oldFee} />
          {newFee == null ? null : <EdgeRow title={lstrings.transaction_details_accelerate_transaction_new_fee_title} body={newFee} />}
        </View>
        {isLowerAmount ? (
          <WarningCard
            title={lstrings.transaction_details_accelerate_transaction_lower_amount_tx_title}
            points={[lstrings.transaction_details_accelerate_transaction_lower_amount_tx_message]}
            marginRem={[1.5, 1]}
          />
        ) : null}
        {error == null ? null : (
          <View style={styles.error}>
            <Text style={styles.errorText} numberOfLines={3}>
              {error.message}
            </Text>
          </View>
        )}
        <View style={styles.container}>
          <Slider
            disabled={isSending || !!error}
            onSlidingComplete={this.handleConfirmation}
            showSpinner={isSending}
            disabledText={lstrings.transaction_details_accelerate_transaction_slider_disabled}
          />
        </View>
      </EdgeModal>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  loadingContianer: {
    height: theme.rem(20)
  },
  error: {
    marginVertical: theme.rem(0.5)
  },
  errorText: {
    textAlign: 'center',
    color: theme.negativeText
  },
  loading: {
    flex: 1,
    alignSelf: 'center'
  },
  container: {
    maxHeight: theme.rem(20),
    marginVertical: theme.rem(0.5)
  }
}))

export function AccelerateTxModal(props: OwnProps): JSX.Element {
  const theme = useTheme()

  const exchangeRates = useSelector(state => state.exchangeRates)
  const feeDisplayDenomination = useSelector(state => selectDisplayDenom(state, props.wallet.currencyConfig, null))
  const isoFiatCurrencyCode = useSelector(state => state.ui.settings.defaultIsoFiat)

  return (
    <AccelerateTxModalComponent
      {...props}
      exchangeRates={exchangeRates}
      feeDisplayDenomination={feeDisplayDenomination}
      isoFiatCurrencyCode={isoFiatCurrencyCode}
      theme={theme}
    />
  )
}

function getTxSendAmount(edgeTransaction: EdgeTransaction): string {
  // Transaction amounts are negative for send transactions
  const nativeAmount = abs(edgeTransaction.nativeAmount)
  // Parent network fee is used for token sends
  const feeAmount = edgeTransaction.parentNetworkFee ?? edgeTransaction.networkFee
  return sub(nativeAmount, feeAmount)
}
