// @flow
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { ActivityIndicator, Alert, Text, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import type { EdgeCurrencyWallet, EdgeDenomination, EdgeTransaction, EdgeSpendInfo } from 'edge-core-js'

import { sprintf } from 'sprintf-js'

import { playSendSound } from '../../actions/SoundActions.js'
import { TRANSACTION_DETAILS } from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { Slider } from '../../modules/UI/components/Slider/Slider.ui.js'
import { getSelectedWallet } from '../../modules/UI/selectors.js'
import { type RootState } from '../../types/reduxTypes.js'
import type { GuiWallet } from '../../types/types.js'
import * as UTILS from '../../util/utils.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { ModalTitle, ModalMessage, ModalCloseArrow } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'
import { Tile } from '../themed/Tile.js'
import { type AirshipBridge } from './modalParts'

type Props = OwnProps & StateProps & ThemeProps
type OwnProps = {
  bridge: AirshipBridge<Status>,
  edgeTransaction: EdgeTransaction,
  guiWallet: GuiWallet,
  walletDefaultDenomProps: EdgeDenomination
}
type StateProps = {
  wallet: EdgeCurrencyWallet
}

type State = {
  edgeUnsignedTransaction: ?EdgeTransaction,
  error: ?Error,
  status: Status
}

type Status = 'confirming' | 'sending' | 'sent'

class TransactionAccelerateModalComponent extends PureComponent<Props, State> {
  constructor() {
    super()

    this.state = {
      edgeUnsignedTransaction: null,
      error: null,
      status: 'confirming'
    }
  }

  componentDidMount() {
    this.makeRbfTransaction()
  }

  componentWillUnmount() {
    this.resetRbfState()
  }

  makeRbfTransaction = async () => {
    const { edgeTransaction, wallet } = this.props

    if (edgeTransaction.spendTargets) {
      const spendTargets = edgeTransaction.spendTargets.map(spendTarget => ({
        nativeAmount: spendTarget.nativeAmount,
        publicAddress: spendTarget.publicAddress,
        uniqueIdentifier: spendTarget.uniqueIdentifier
      }))
      const rbfTxid = edgeTransaction.txid

      const edgeSpendInfo: EdgeSpendInfo = {
        spendTargets,
        rbfTxid
      }

      try {
        const edgeUnsignedTransaction = await wallet.makeSpend(edgeSpendInfo)

        this.setState({
          edgeUnsignedTransaction
        })
      } catch (error) {
        this.setState({
          error: error
        })
      }
    }
  }

  signBroadcastAndSaveRbf = async () => {
    const { wallet } = this.props
    const { edgeUnsignedTransaction } = this.state

    if (edgeUnsignedTransaction) {
      let edgeSignedTransaction: EdgeTransaction = edgeUnsignedTransaction

      this.setState({ status: 'sending' })

      try {
        edgeSignedTransaction = await wallet.signTx(edgeUnsignedTransaction)
        edgeSignedTransaction = await wallet.broadcastTx(edgeSignedTransaction)
        await wallet.saveTx(edgeSignedTransaction)

        // Should we save tx metadata? Where do we get the metadata?
        // await wallet.saveTxMetadata(edgeSignedTransaction.txid, edgeSignedTransaction.currencyCode, edgeMetadata)

        playSendSound().catch(error => console.log(error)) // Fail quietly

        this.setState({ status: 'sent' })

        Alert.alert(s.strings.transaction_success, s.strings.transaction_success_message, [
          {
            onPress() {},
            style: 'default',
            text: s.strings.string_ok
          }
        ])

        Actions.replace(TRANSACTION_DETAILS, { edgeTransaction: edgeSignedTransaction })
      } catch (error) {
        console.log(error)
        this.setState({ status: 'confirming' })
        let message = sprintf(s.strings.transaction_failure_message, error.message)

        Alert.alert(s.strings.transaction_failure, message, [
          {
            onPress() {},
            style: 'default',
            text: s.strings.string_ok
          }
        ])
      }
    } else {
      throw new Error(s.strings.invalid_spend_request)
    }
  }

  resetRbfState = () => {
    this.setState({ edgeUnsignedTransaction: null, error: null, status: 'confirming' })
  }

  closeModal = () => {
    this.props.bridge.resolve(this.state.status)
    this.resetRbfState()
  }

  handleConfirmation = async () => {
    await this.signBroadcastAndSaveRbf()
    this.closeModal()
  }

  render() {
    const { bridge, edgeTransaction, guiWallet, theme, walletDefaultDenomProps } = this.props
    const { error, status, edgeUnsignedTransaction } = this.state

    const styles = getStyles(theme)

    const symbolString =
      UTILS.isCryptoParentCurrency(guiWallet, edgeTransaction.currencyCode) && walletDefaultDenomProps.symbol ? walletDefaultDenomProps.symbol : ''

    const oldFeeAmount = UTILS.convertNativeToDisplay(walletDefaultDenomProps.multiplier)(edgeTransaction.networkFee)
    const oldFee = `${symbolString} ${oldFeeAmount}`

    const newFeeAmount = edgeUnsignedTransaction
      ? UTILS.convertNativeToDisplay(walletDefaultDenomProps.multiplier)(edgeUnsignedTransaction.networkFee)
      : undefined
    const newFee = newFeeAmount ? `${symbolString} ${newFeeAmount}` : ''

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
                sliderDisabled={isSending || !!error}
                onSlidingComplete={this.handleConfirmation}
                showSpinner={isSending}
                disabledText={s.strings.transaction_details_accelerate_transaction_slider_disabled}
              />
            </View>
            <ModalCloseArrow onPress={this.closeModal} />
          </>
        ) : (
          <View style={styles.loadingContianer}>
            <ActivityIndicator style={styles.loading} size={'large'} />
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
    margin: theme.rem(0.5)
  }
}))

const mapStateToProps = (state: RootState): StateProps => {
  const { account } = state.core
  const { currencyWallets = {} } = account

  const guiWallet = getSelectedWallet(state)
  const wallet = currencyWallets[guiWallet.id]

  return {
    wallet
  }
}

export const TransactionAccelerateModal = connect(mapStateToProps)(withTheme(TransactionAccelerateModalComponent))
