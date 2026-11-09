import { abs, lt, sub } from 'biggystring'
import type {
  EdgeCurrencyWallet,
  EdgeDenomination,
  EdgeTokenId,
  EdgeTransaction
} from 'edge-core-js'
import React, { PureComponent } from 'react'
import { View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'

import type { GuiExchangeRates } from '../../actions/ExchangeRateActions'
import { lstrings } from '../../locales/strings'
import {
  getExchangeDenom,
  selectDisplayDenom
} from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { convertTransactionFeeToDisplayFee } from '../../util/utils'
import { WarningCard } from '../cards/WarningCard'
import { EdgeRow } from '../rows/EdgeRow'
import {
  cacheStyles,
  type Theme,
  type ThemeProps,
  useTheme
} from '../services/ThemeContext'
import { UnscaledText } from '../text/UnscaledText'
import { Paragraph } from '../themed/EdgeText'
import { SafeSlider } from '../themed/SafeSlider'
import { EdgeModal } from './EdgeModal'

interface OwnProps {
  acceleratedTx: EdgeTransaction
  bridge: AirshipBridge<EdgeTransaction | null>
  replacedTx: EdgeTransaction
  wallet: EdgeCurrencyWallet
}
interface StateProps {
  /** Display denomination of the asset the accelerated transaction sends */
  amountDisplayDenomination: EdgeDenomination
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

  signBroadcastAndSave = async (): Promise<void> => {
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

  closeModal = (signedTx: EdgeTransaction | null, err?: Error): void => {
    this.setState({
      mounted: false
    })
    if (err != null) this.props.bridge.reject(err)
    else this.props.bridge.resolve(signedTx)
  }

  handleCancel = (): void => {
    this.closeModal(null)
  }

  handleConfirmation = async (reset: () => void): Promise<void> => {
    try {
      await this.signBroadcastAndSave()
    } finally {
      reset()
    }
  }

  getTxFeeDisplay = (edgeTransaction: EdgeTransaction): string => {
    return this.formatAmount(
      edgeTransaction,
      null,
      this.props.feeDisplayDenomination
    )
  }

  /**
   * The amount one spend target receives, in the units and fiat rate of the
   * asset being sent (a token send pays out in the token, not the parent
   * currency the fee is paid in).
   */
  getSendAmountDisplay = (nativeAmount: string): string => {
    const { acceleratedTx, amountDisplayDenomination } = this.props
    return this.formatAmount(
      {
        ...acceleratedTx,
        networkFee: nativeAmount,
        parentNetworkFee: undefined
      },
      acceleratedTx.tokenId,
      amountDisplayDenomination
    )
  }

  /**
   * Formats the fee of a transaction as "<crypto> (<fiat>)" for the asset
   * named by tokenId. The send amount reuses it by standing in for the fee.
   */
  formatAmount = (
    edgeTransaction: EdgeTransaction,
    tokenId: EdgeTokenId,
    displayDenomination: EdgeDenomination
  ): string => {
    const { exchangeRates, wallet, isoFiatCurrencyCode } = this.props

    const transactionFee = convertTransactionFeeToDisplayFee(
      wallet.currencyInfo.pluginId,
      tokenId,
      isoFiatCurrencyCode,
      exchangeRates,
      edgeTransaction,
      displayDenomination,
      getExchangeDenom(wallet.currencyConfig, tokenId)
    )

    return `${transactionFee.cryptoSymbol ?? ''} ${
      transactionFee.cryptoAmount
    } (${transactionFee.fiatSymbol ?? ''} ${transactionFee.fiatAmount})`
  }

  render(): React.ReactElement {
    const { acceleratedTx, bridge, replacedTx, theme } = this.props
    const { error, status } = this.state

    const styles = getStyles(theme)

    const oldFee = this.getTxFeeDisplay(replacedTx)
    const newFee = this.getTxFeeDisplay(acceleratedTx)

    // Where the accelerated funds go. The plugin names every output of the
    // replacement that is not the wallet's own.
    const spendTargets = acceleratedTx.spendTargets ?? []

    const isLowerAmount = lt(
      getTxSendAmount(acceleratedTx),
      getTxSendAmount(replacedTx)
    )
    const isSending = status === 'sending'

    return (
      <EdgeModal
        bridge={bridge}
        onCancel={this.handleCancel}
        title={lstrings.transaction_details_accelerate_transaction_header}
      >
        <Paragraph>
          {lstrings.transaction_details_accelerate_transaction_instructional}
        </Paragraph>
        <View style={styles.container}>
          {spendTargets.map((target, index) => (
            <React.Fragment key={`${index}`}>
              <EdgeRow
                maximumHeight="large"
                rightButtonType="copy"
                title={
                  lstrings.transaction_details_accelerate_transaction_recipient_title
                }
                body={target.publicAddress}
              />
              <EdgeRow
                title={
                  lstrings.transaction_details_accelerate_transaction_amount_title
                }
                body={this.getSendAmountDisplay(target.nativeAmount)}
              />
            </React.Fragment>
          ))}
          <EdgeRow
            title={
              lstrings.transaction_details_accelerate_transaction_old_fee_title
            }
            body={oldFee}
          />
          {newFee == null ? null : (
            <EdgeRow
              title={
                lstrings.transaction_details_accelerate_transaction_new_fee_title
              }
              body={newFee}
            />
          )}
        </View>
        {isLowerAmount ? (
          <WarningCard
            title={
              lstrings.transaction_details_accelerate_transaction_lower_amount_tx_title
            }
            points={[
              lstrings.transaction_details_accelerate_transaction_lower_amount_tx_message
            ]}
            marginRem={[1.5, 1]}
          />
        ) : null}
        {error == null ? null : (
          <View style={styles.error}>
            <UnscaledText style={styles.errorText} numberOfLines={3}>
              {error.message}
            </UnscaledText>
          </View>
        )}
        <View style={styles.container}>
          <SafeSlider
            disabled={isSending || error != null}
            onSlidingComplete={this.handleConfirmation}
            disabledText={
              lstrings.transaction_details_accelerate_transaction_slider_disabled
            }
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

export function AccelerateTxModal(props: OwnProps): React.ReactElement {
  const theme = useTheme()

  const amountDisplayDenomination = useSelector(state =>
    selectDisplayDenom(
      state,
      props.wallet.currencyConfig,
      props.acceleratedTx.tokenId
    )
  )
  const exchangeRates = useSelector(state => state.exchangeRates)
  const feeDisplayDenomination = useSelector(state =>
    selectDisplayDenom(state, props.wallet.currencyConfig, null)
  )
  const isoFiatCurrencyCode = useSelector(
    state => state.ui.settings.defaultIsoFiat
  )

  return (
    <AccelerateTxModalComponent
      {...props}
      amountDisplayDenomination={amountDisplayDenomination}
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
  const feeAmount =
    edgeTransaction.parentNetworkFee ?? edgeTransaction.networkFee
  return sub(nativeAmount, feeAmount)
}
