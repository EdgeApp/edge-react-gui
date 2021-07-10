// @flow

import type { EdgeCurrencyWallet, EdgeDenomination, EdgeSpendInfo, EdgeTransaction } from 'edge-core-js'
import React, { PureComponent } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { playSendSound } from '../../actions/SoundActions.js'
import { TRANSACTION_DETAILS } from '../../constants/SceneKeys.js'
import s from '../../locales/strings.js'
import { Slider } from '../../modules/UI/components/Slider/Slider.js'
import { getDisplayDenomination } from '../../selectors/DenominationSelectors.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import type { GuiWallet } from '../../types/types.js'
import { type GuiExchangeRates } from '../../types/types.js'
import * as UTILS from '../../util/utils.js'
import { showError, showToast, showWarning } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'
import { Tile } from '../themed/Tile.js'
import { type AirshipBridge } from './modalParts'

type Status = 'confirming' | 'sending' | 'sent'

type OwnProps = {
  bridge: AirshipBridge<Status>,
  edgeTransaction: EdgeTransaction,
  wallet: EdgeCurrencyWallet,
  guiWallet: GuiWallet
}
type StateProps = {
  edgeDenomination: EdgeDenomination,
  selectedCurrencyCode: string,
  exchangeRates: GuiExchangeRates,
  settings: any
}
type Props = OwnProps & StateProps & ThemeProps

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
      const spendTargets = edgeTransactionSpendTargets.map(spendTarget => ({
        nativeAmount: spendTarget.nativeAmount,
        publicAddress: spendTarget.publicAddress,
        uniqueIdentifier: spendTarget.uniqueIdentifier
      }))
      const rbfTxid = edgeTransaction.txid
      const currencyCode = edgeTransactionSpendTargets[0].currencyCode

      const edgeSpendInfo: EdgeSpendInfo = {
        currencyCode,
        spendTargets,
        rbfTxid
      }

      try {
        let edgeUnsignedTransaction = await wallet.makeSpend(edgeSpendInfo)

        // Copy the replaced transaction's metadata to the RBF transaction
        edgeUnsignedTransaction = { ...edgeUnsignedTransaction, metadata: edgeTransaction.metadata }

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
    const { edgeTransaction, wallet } = this.props
    const { edgeUnsignedTransaction } = this.state

    if (edgeUnsignedTransaction) {
      let edgeSignedTransaction: EdgeTransaction = edgeUnsignedTransaction

      this.setState({ status: 'sending' })

      try {
        // Sign and broadcast the RBF transaction
        edgeSignedTransaction = await wallet.signTx(edgeUnsignedTransaction)
        edgeSignedTransaction = await wallet.broadcastTx(edgeSignedTransaction)

        // Copy the replaced transaction's metadata to the RBF transaction
        edgeSignedTransaction = { ...edgeSignedTransaction, metadata: edgeTransaction.metadata }

        // Save the RBF transactoin
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

  getTxFeeDisplay = (edgeTransaction: EdgeTransaction, edgeDenomination: EdgeDenomination): string => {
    const { exchangeRates, guiWallet, settings, selectedCurrencyCode } = this.props

    const transactionFee = UTILS.convertTransactionFeeToDisplayFee(guiWallet, selectedCurrencyCode, exchangeRates, edgeTransaction, settings)

    const feeSyntax = `${transactionFee.cryptoSymbol || ''} ${transactionFee.cryptoAmount} (${transactionFee.fiatSymbol || ''} ${transactionFee.fiatAmount})`

    return feeSyntax
  }

  render() {
    const { bridge, edgeTransaction, theme, edgeDenomination } = this.props
    const { error, status, edgeUnsignedTransaction } = this.state

    const styles = getStyles(theme)

    const oldFee = this.getTxFeeDisplay(edgeTransaction, edgeDenomination)
    const newFee = edgeUnsignedTransaction != null ? this.getTxFeeDisplay(edgeUnsignedTransaction, edgeDenomination) : ''

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

export const AccelerateTxModel = connect(
  (state: RootState, ownProps: OwnProps): StateProps => ({
    edgeDenomination: getDisplayDenomination(state, ownProps.wallet.currencyInfo.currencyCode),
    selectedCurrencyCode: state.ui.wallets.selectedCurrencyCode,
    exchangeRates: state.exchangeRates,
    settings: state.ui.settings
  }),
  (dispatch: Dispatch) => ({})
)(withTheme(AccelerateTxModelComponent))
