// @flow

import type { EdgeCurrencyWallet, EdgeDenomination, EdgeSpendInfo, EdgeTransaction } from 'edge-core-js'
import React, { PureComponent } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'

import { playSendSound } from '../../actions/SoundActions.js'
import { TRANSACTION_DETAILS } from '../../constants/SceneKeys.js'
import s from '../../locales/strings.js'
import { Slider } from '../../modules/UI/components/Slider/Slider.js'
import { getDisplayDenominationFromState, getExchangeDenominationFromState } from '../../selectors/DenominationSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { Actions } from '../../types/routerTypes.js'
import { type GuiExchangeRates } from '../../types/types.js'
import { convertTransactionFeeToDisplayFee } from '../../util/utils.js'
import { showError, showToast, showWarning } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'
import { Tile } from '../themed/Tile.js'

type Status = 'confirming' | 'sending' | 'sent'

type OwnProps = {
  bridge: AirshipBridge<Status>,
  edgeTransaction: EdgeTransaction,
  wallet: EdgeCurrencyWallet
}
type StateProps = {
  exchangeRates: GuiExchangeRates
}
type DispatchProps = {
  getDisplayDenomination: (pluginId: string, currencyCode: string) => EdgeDenomination,
  getExchangeDenomination: (pluginId: string, currencyCode: string) => EdgeDenomination
}
type Props = OwnProps & StateProps & ThemeProps & DispatchProps

type State = {
  edgeUnsignedTransaction?: EdgeTransaction,
  error?: Error,
  status: Status,
  mounted: boolean
}

class AccelerateTxModelComponent extends PureComponent<Props, State> {
  constructor() {
    super()

    this.state = {
      edgeUnsignedTransaction: undefined,
      error: undefined,
      status: 'confirming',
      mounted: true
    }
  }

  componentDidMount() {
    this.makeRbfTransaction()
  }

  makeRbfTransaction = async () => {
    const { edgeTransaction, wallet } = this.props

    const edgeTransactionSpendTargets = edgeTransaction.spendTargets

    if (edgeTransactionSpendTargets && edgeTransactionSpendTargets.length) {
      // Currency code for the new tx is the same as the first spend target
      const { currencyCode } = edgeTransactionSpendTargets[0]
      // Map the EdgeTransaction.spendTargets type to EdgeSpendTargets
      const spendTargets = edgeTransactionSpendTargets.map(spendTarget => ({
        nativeAmount: spendTarget.nativeAmount,
        publicAddress: spendTarget.publicAddress,
        uniqueIdentifier: spendTarget.uniqueIdentifier
      }))
      const {
        // Use the txid from the replaced transaction as the rbfTxid
        txid: rbfTxid,
        // Copy replaced transaction's metadata and swapInfo to the RBF transaction
        metadata,
        swapData
      } = edgeTransaction

      const edgeSpendInfo: EdgeSpendInfo = {
        currencyCode,
        spendTargets,
        rbfTxid,
        metadata,
        swapData
      }

      try {
        const edgeUnsignedTransaction = await wallet.makeSpend(edgeSpendInfo)

        this.setState({
          edgeUnsignedTransaction
        })
      } catch (error) {
        this.setState({
          error
        })
      }
    } else {
      const error = new Error('Missing spend target data.')
      this.setState({
        error
      })
    }
  }

  signBroadcastAndSaveRbf = async () => {
    const { wallet } = this.props
    const { edgeUnsignedTransaction } = this.state

    if (edgeUnsignedTransaction) {
      let edgeSignedTransaction: EdgeTransaction = edgeUnsignedTransaction

      this.setState({ status: 'sending' })

      try {
        // Sign, broadcast, and save the RBF transaction
        edgeSignedTransaction = await wallet.signTx(edgeUnsignedTransaction)
        edgeSignedTransaction = await wallet.broadcastTx(edgeSignedTransaction)
        await wallet.saveTx(edgeSignedTransaction)

        if (this.state.mounted) {
          playSendSound().catch(error => console.log(error)) // Fail quietly

          this.setState({ status: 'sent' })

          showToast(s.strings.transaction_success_message)

          Actions.replace(TRANSACTION_DETAILS, { edgeTransaction: edgeSignedTransaction })
        } else {
          showWarning(s.strings.transaction_success_message)
        }
      } catch (error) {
        console.log(error)

        if (this.state.mounted) {
          this.setState({ status: 'confirming' })
          showError(error)
        }
      }
    } else {
      throw new Error(s.strings.invalid_spend_request)
    }
  }

  closeModal = () => {
    this.setState({
      mounted: false
    })
    this.props.bridge.resolve(this.state.status)
  }

  handleConfirmation = async () => {
    await this.signBroadcastAndSaveRbf()
    this.closeModal()
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
    const { bridge, edgeTransaction, theme } = this.props
    const { error, status, edgeUnsignedTransaction } = this.state

    const styles = getStyles(theme)

    const oldFee = this.getTxFeeDisplay(edgeTransaction)
    const newFee = edgeUnsignedTransaction != null ? this.getTxFeeDisplay(edgeUnsignedTransaction) : ''

    const isSending = status === 'sending'

    return (
      <ThemedModal bridge={bridge} onCancel={this.closeModal}>
        {edgeUnsignedTransaction || error ? (
          <>
            <ModalTitle>{s.strings.transaction_details_accelerate_transaction_header}</ModalTitle>
            <ModalMessage>{s.strings.transaction_details_accelerate_transaction_instructional}</ModalMessage>
            <View style={styles.container}>
              <Tile type="static" title={s.strings.transaction_details_accelerate_transaction_old_fee_title} body={oldFee} />
              {!!newFee && <Tile type="static" title={s.strings.transaction_details_accelerate_transaction_new_fee_title} body={newFee} />}
            </View>
            {error && (
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
                disabledText={s.strings.transaction_details_accelerate_transaction_slider_disabled}
              />
            </View>
            <ModalCloseArrow onPress={this.closeModal} />
          </>
        ) : (
          <View style={styles.loadingContianer}>
            <ActivityIndicator color={theme.primaryText} style={styles.loading} size="large" />
          </View>
        )}
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

export const AccelerateTxModel = connect<StateProps, DispatchProps, OwnProps>(
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
)(withTheme(AccelerateTxModelComponent))
