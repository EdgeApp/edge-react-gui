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
import { ScrollView } from 'react-native-gesture-handler'

import type { GuiExchangeRates } from '../../actions/ExchangeRateActions'
import { lstrings } from '../../locales/strings'
import {
  getExchangeDenom,
  selectDisplayDenom
} from '../../selectors/DenominationSelectors'
import { getExchangeRate } from '../../selectors/WalletSelectors'
import { useSelector } from '../../types/reactRedux'
import {
  convertNativeAmountToDisplayAmount,
  convertTransactionFeeToDisplayFee
} from '../../util/utils'
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
    const {
      exchangeRates,
      feeDisplayDenomination,
      wallet,
      isoFiatCurrencyCode
    } = this.props

    return formatAmount(
      convertTransactionFeeToDisplayFee(
        wallet.currencyInfo.pluginId,
        null,
        isoFiatCurrencyCode,
        exchangeRates,
        edgeTransaction,
        feeDisplayDenomination,
        getExchangeDenom(wallet.currencyConfig, null)
      ),
      this.hasExchangeRate(null)
    )
  }

  /**
   * The amount one spend target receives, in the units and fiat rate of the
   * asset being sent (a token send pays out in the token, not the parent
   * currency the fee is paid in).
   */
  getSendAmountDisplay = (nativeAmount: string): string => {
    const {
      acceleratedTx,
      amountDisplayDenomination,
      exchangeRates,
      wallet,
      isoFiatCurrencyCode
    } = this.props
    const { tokenId } = acceleratedTx

    return formatAmount(
      convertNativeAmountToDisplayAmount(
        wallet.currencyInfo.pluginId,
        tokenId,
        isoFiatCurrencyCode,
        exchangeRates,
        nativeAmount,
        amountDisplayDenomination,
        getExchangeDenom(wallet.currencyConfig, tokenId)
      ),
      this.hasExchangeRate(tokenId)
    )
  }

  /** Whether a fiat value can be shown for one of the wallet's assets */
  hasExchangeRate = (tokenId: EdgeTokenId): boolean => {
    const { exchangeRates, wallet, isoFiatCurrencyCode } = this.props
    return (
      getExchangeRate(
        exchangeRates,
        wallet.currencyInfo.pluginId,
        tokenId,
        isoFiatCurrencyCode
      ) !== 0
    )
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
          {spendTargets.length > 0
            ? lstrings.transaction_details_accelerate_transaction_instructional_recipient
            : lstrings.transaction_details_accelerate_transaction_instructional}
        </Paragraph>
        <ScrollView style={styles.rows}>
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
        </ScrollView>
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
  },
  // The rows scroll once they outgrow their share of the modal, so every
  // recipient stays reachable above the slider:
  rows: {
    flexGrow: 0,
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

/**
 * Lays out an amount as "<crypto> (<fiat>)". The fee rows and the send amount
 * rows share it, so they read the same way. Without an exchange rate the fiat
 * value would read as zero, which looks like a real amount on a confirmation,
 * so it is left out.
 */
function formatAmount(
  amount: {
    cryptoSymbol?: string
    cryptoAmount: string
    fiatSymbol?: string
    fiatAmount: string
  },
  hasExchangeRate: boolean
): string {
  const crypto = `${amount.cryptoSymbol ?? ''} ${amount.cryptoAmount}`
  if (!hasExchangeRate) return crypto
  return `${crypto} (${amount.fiatSymbol ?? ''} ${amount.fiatAmount})`
}

function getTxSendAmount(edgeTransaction: EdgeTransaction): string {
  // Transaction amounts are negative for send transactions
  const nativeAmount = abs(edgeTransaction.nativeAmount)
  // Parent network fee is used for token sends
  const feeAmount =
    edgeTransaction.parentNetworkFee ?? edgeTransaction.networkFee
  return sub(nativeAmount, feeAmount)
}
