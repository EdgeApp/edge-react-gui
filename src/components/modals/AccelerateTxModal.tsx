import { EdgeCurrencyWallet, EdgeDenomination, EdgeTransaction } from 'edge-core-js'
import React, { PureComponent } from 'react'
import { Text, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { lstrings } from '../../locales/strings'
import { getDisplayDenominationFromState, getExchangeDenominationFromState } from '../../selectors/DenominationSelectors'
import { connect } from '../../types/reactRedux'
import { GuiExchangeRates } from '../../types/types'
import { convertTransactionFeeToDisplayFee } from '../../util/utils'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { ModalMessage, ModalTitle } from '../themed/ModalParts'
import { Slider } from '../themed/Slider'
import { ThemedModal } from '../themed/ThemedModal'
import { Tile } from '../tiles/Tile'

interface OwnProps {
  acceleratedTx: EdgeTransaction
  bridge: AirshipBridge<EdgeTransaction | null>
  replacedTx: EdgeTransaction
  wallet: EdgeCurrencyWallet
}
interface StateProps {
  exchangeRates: GuiExchangeRates
}
interface DispatchProps {
  getDisplayDenomination: (pluginId: string, currencyCode: string) => EdgeDenomination
  getExchangeDenomination: (pluginId: string, currencyCode: string) => EdgeDenomination
}
type Props = OwnProps & StateProps & ThemeProps & DispatchProps

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
    const { exchangeRates, wallet, getDisplayDenomination, getExchangeDenomination } = this.props

    const feeDisplayDenomination = getDisplayDenomination(wallet.currencyInfo.pluginId, wallet.currencyInfo.currencyCode)
    const feeDefaultDenomination = getExchangeDenomination(wallet.currencyInfo.pluginId, wallet.currencyInfo.currencyCode)
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

    const isSending = status === 'sending'

    return (
      <ThemedModal bridge={bridge} onCancel={this.handleCancel}>
        <ModalTitle>{lstrings.transaction_details_accelerate_transaction_header}</ModalTitle>
        <ModalMessage>{lstrings.transaction_details_accelerate_transaction_instructional}</ModalMessage>
        <View style={styles.container}>
          <Tile type="static" title={lstrings.transaction_details_accelerate_transaction_old_fee_title} body={oldFee} />
          {newFee == null ? null : <Tile type="static" title={lstrings.transaction_details_accelerate_transaction_new_fee_title} body={newFee} />}
        </View>
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
      </ThemedModal>
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

export const AccelerateTxModal = connect<StateProps, DispatchProps, OwnProps>(
  (state, ownProps) => ({
    exchangeRates: state.exchangeRates
  }),
  dispatch => ({
    getDisplayDenomination(pluginId: string, currencyCode: string) {
      return dispatch(getDisplayDenominationFromState(pluginId, currencyCode))
    },
    getExchangeDenomination(pluginId: string, currencyCode: string) {
      return dispatch(getExchangeDenominationFromState(pluginId, currencyCode))
    }
  })
)(withTheme(AccelerateTxModalComponent))
