import { abs, lt, sub } from 'biggystring'
import { EdgeCurrencyWallet, EdgeDenomination, EdgeTransaction } from 'edge-core-js'
import React, { PureComponent } from 'react'
import { Text, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { lstrings } from '../../locales/strings'
import { getExchangeDenom, selectDisplayDenom } from '../../selectors/DenominationSelectors'
import { connect } from '../../types/reactRedux'
import { GuiExchangeRates } from '../../types/types'
import { convertTransactionFeeToDisplayFee } from '../../util/utils'
import { WarningCard } from '../cards/WarningCard'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { Paragraph } from '../themed/EdgeText'
import { Slider } from '../themed/Slider'
import { ModalUi4 } from '../ui4/ModalUi4'
import { RowUi4 } from '../ui4/RowUi4'

interface OwnProps {
  acceleratedTx: EdgeTransaction
  bridge: AirshipBridge<EdgeTransaction | null>
  replacedTx: EdgeTransaction
  wallet: EdgeCurrencyWallet
}
interface StateProps {
  exchangeRates: GuiExchangeRates
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
    const { exchangeRates, feeDisplayDenomination, wallet } = this.props

    const feeDefaultDenomination = getExchangeDenom(wallet.currencyConfig, null)
    const transactionFee = convertTransactionFeeToDisplayFee(wallet, exchangeRates, edgeTransaction, feeDisplayDenomination, feeDefaultDenomination)

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
      <ModalUi4 bridge={bridge} onCancel={this.handleCancel} title={lstrings.transaction_details_accelerate_transaction_header}>
        <Paragraph>{lstrings.transaction_details_accelerate_transaction_instructional}</Paragraph>
        <View style={styles.container}>
          <RowUi4 title={lstrings.transaction_details_accelerate_transaction_old_fee_title} body={oldFee} />
          {newFee == null ? null : <RowUi4 title={lstrings.transaction_details_accelerate_transaction_new_fee_title} body={newFee} />}
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
      </ModalUi4>
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

export const AccelerateTxModal = connect<StateProps, {}, OwnProps>(
  (state, ownProps) => ({
    exchangeRates: state.exchangeRates,
    feeDisplayDenomination: selectDisplayDenom(state, ownProps.wallet.currencyConfig, null)
  }),
  dispatch => ({})
)(withTheme(AccelerateTxModalComponent))

function getTxSendAmount(edgeTransaction: EdgeTransaction): string {
  // Transaction amounts are negative for send transactions
  const nativeAmount = abs(edgeTransaction.nativeAmount)
  // Parent network fee is used for token sends
  const feeAmount = edgeTransaction.parentNetworkFee ?? edgeTransaction.networkFee
  return sub(nativeAmount, feeAmount)
}
