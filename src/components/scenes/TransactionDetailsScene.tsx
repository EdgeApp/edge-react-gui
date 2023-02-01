import { abs, div, gt, mul, sub, toFixed } from 'biggystring'
import { EdgeCurrencyWallet, EdgeDenomination, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { Linking, Platform, ScrollView, TouchableWithoutFeedback, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import Mailer from 'react-native-mail'
import SafariView from 'react-native-safari-view'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { playSendSound } from '../../actions/SoundActions'
import { getSubcategories, setNewSubcategory } from '../../actions/TransactionDetailsActions'
import { refreshTransactionsRequest } from '../../actions/TransactionListActions'
import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { displayFiatAmount } from '../../hooks/useFiatText'
import { useWalletName } from '../../hooks/useWalletName'
import s from '../../locales/strings'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { convertCurrencyFromExchangeRates } from '../../selectors/WalletSelectors'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../types/routerTypes'
import { GuiContact } from '../../types/types'
import { formatCategory, joinCategory, splitCategory } from '../../util/categories'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { getHistoricalRate } from '../../util/exchangeRates'
import { convertNativeToDisplay, convertNativeToExchange, isValidInput, truncateDecimals } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { AccelerateTxModal } from '../modals/AccelerateTxModal'
import { AdvancedDetailsModal } from '../modals/AdvancedDetailsModal'
import { CategoryModal } from '../modals/CategoryModal'
import { ContactListModal, ContactModalResult } from '../modals/ContactListModal'
import { RawTextModal } from '../modals/RawTextModal'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { Tile } from '../tiles/Tile'

interface OwnProps {
  navigation: NavigationProp<'transactionDetails'>
  route: RouteProp<'transactionDetails'>
  wallet: EdgeCurrencyWallet
}
interface StateProps {
  contacts: GuiContact[]
  currentFiatAmount: string
  destinationDenomination?: EdgeDenomination
  destinationWalletName?: string
  subcategoriesList: string[]
  walletName: string
  walletDefaultDenomProps: EdgeDenomination
}
interface DispatchProps {
  getSubcategories: () => void
  refreshTransaction: (walletId: string, transaction: EdgeTransaction) => void
  setNewSubcategory: (newSubcategory: string) => void
}
type Props = OwnProps & StateProps & DispatchProps & ThemeProps

interface State {
  acceleratedTx: EdgeTransaction | null
  amountFiat: string
  bizId: number
  category: string
  contactName: string // remove commenting once metaData in Redux
  direction: string
  notes: string
  thumbnailPath?: string
}

interface FiatCryptoAmountUI {
  amountString: string
  symbolString: string
  feeString: string
}

interface FiatCurrentAmountUI {
  amount: string
  difference: string
  percentage: string
}

const getAbsoluteAmount = (edgeTransaction: EdgeTransaction): string =>
  edgeTransaction && edgeTransaction.nativeAmount ? abs(edgeTransaction.nativeAmount) : ''

// Only exported for unit-testing purposes
class TransactionDetailsComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const { thumbnailPath, edgeTransaction } = props.route.params
    const { metadata } = edgeTransaction
    const { name: contactName = '', notes = '', amountFiat = 0 } = metadata ?? {}
    const direction = parseInt(edgeTransaction.nativeAmount) >= 0 ? 'receive' : 'send'
    const category = joinCategory(
      splitCategory(
        metadata?.category,
        // Pick the right default:
        direction === 'receive' ? 'income' : 'expense'
      )
    )

    this.state = {
      acceleratedTx: null,
      amountFiat: displayFiatAmount(amountFiat),
      bizId: 0,
      category,
      contactName,
      direction,
      notes,
      thumbnailPath
    }
  }

  async componentDidMount() {
    const { route, wallet } = this.props
    const { amountFiat: defaultAmountFiat, edgeTransaction } = route.params

    this.props.getSubcategories()

    if (Number(this.state.amountFiat.replace(',', '.')) === 0 && defaultAmountFiat != null && defaultAmountFiat !== 0) {
      this.setState({ amountFiat: displayFiatAmount(defaultAmountFiat) })
    } else {
      const { currencyCode, date, nativeAmount } = edgeTransaction
      const isoDate = new Date(date * 1000).toISOString()

      const exchangeAmount = await wallet.nativeToDenomination(nativeAmount, currencyCode)
      const isoRate = await getHistoricalRate(`${currencyCode}_${wallet.fiatCurrencyCode}`, isoDate)
      const fiatAmount = isoRate * Number(exchangeAmount)
      this.setState({ amountFiat: displayFiatAmount(fiatAmount) })
    }

    // Try accelerating transaction to check if transaction can be accelerated
    this.makeAcceleratedTx(edgeTransaction)
      .then(acceleratedTx => {
        this.setState({ acceleratedTx })
      })
      .catch(_err => {})
  }

  async makeAcceleratedTx(transaction: EdgeTransaction): Promise<EdgeTransaction | null> {
    const { wallet } = this.props

    return await wallet.accelerate(transaction)
  }

  openPersonInput = () => {
    const personLabel = this.state.direction === 'receive' ? s.strings.transaction_details_payer : s.strings.transaction_details_payee
    Airship.show<ContactModalResult | undefined>(bridge => (
      <ContactListModal bridge={bridge} contactType={personLabel} contactName={this.state.contactName} contacts={this.props.contacts} />
    )).then(person => this.onSaveTxDetails(person))
  }

  openFiatInput = () => {
    const { wallet } = this.props
    const fiatCurrencyCode = wallet.fiatCurrencyCode.replace('iso:', '')
    Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        initialValue={this.state.amountFiat}
        inputLabel={fiatCurrencyCode}
        returnKeyType="done"
        keyboardType="numeric"
        submitLabel={s.strings.string_save}
        title={sprintf(s.strings.transaction_details_amount_in_fiat, fiatCurrencyCode)}
      />
    )).then(fiatAmount => {
      const amount = fiatAmount != null ? fiatAmount.replace(',', '.') : ''
      if (amount != null && amount !== '' && isValidInput(amount)) {
        const amountFiat = displayFiatAmount(parseFloat(amount))
        this.onSaveTxDetails({ amountFiat })
      }
    })
  }

  openCategoryInput = () => {
    const { category } = this.state
    Airship.show<string | undefined>(bridge => <CategoryModal bridge={bridge} initialCategory={category} />).then(async category => {
      if (category == null) return
      if (!this.props.subcategoriesList.includes(category)) {
        this.props.setNewSubcategory(category)
      }
      this.onSaveTxDetails({ category })
    })
  }

  openNotesInput = () => {
    Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        initialValue={this.state.notes}
        inputLabel={s.strings.transaction_details_notes_title}
        returnKeyType="done"
        multiline
        submitLabel={s.strings.string_save}
        title={s.strings.transaction_details_notes_title}
      />
    )).then(notes => (notes != null ? this.onSaveTxDetails({ notes }) : null))
  }

  openAccelerateModel = async () => {
    const { acceleratedTx } = this.state
    const { edgeTransaction } = this.props.route.params
    const { navigation, wallet } = this.props

    if (acceleratedTx == null) {
      throw new Error('Missing accelerated transaction data.')
    }

    try {
      const signedTx = await Airship.show<EdgeTransaction | null>(bridge => (
        <AccelerateTxModal bridge={bridge} acceleratedTx={acceleratedTx} replacedTx={edgeTransaction} wallet={wallet} />
      ))

      if (signedTx != null) {
        playSendSound().catch(error => console.log(error))
        showToast(s.strings.transaction_details_accelerate_transaction_sent)

        navigation.pop()
        navigation.push('transactionDetails', {
          edgeTransaction: signedTx,
          walletId: wallet.id
        })
      }
    } catch (err: any) {
      if (err?.message === 'transaction underpriced') {
        const newAcceleratedTx = await this.makeAcceleratedTx(acceleratedTx)
        this.setState({ acceleratedTx: newAcceleratedTx })
        showError(s.strings.transaction_details_accelerate_transaction_fee_too_low)
        return
      }
      showError(err)
    }
  }

  openAdvancedDetails = async () => {
    const { wallet, route } = this.props
    const { edgeTransaction } = route.params

    Airship.show(bridge => (
      <AdvancedDetailsModal bridge={bridge} transaction={edgeTransaction} url={sprintf(wallet.currencyInfo.transactionExplorer, edgeTransaction.txid)} />
    ))
  }

  renderExchangeData = (symbolString: string) => {
    const { destinationDenomination, destinationWalletName, walletName, walletDefaultDenomProps, theme, route } = this.props
    const { edgeTransaction } = route.params
    const { swapData, spendTargets } = edgeTransaction
    const styles = getStyles(theme)

    if (!swapData || !spendTargets || !destinationDenomination) return null

    const { plugin, isEstimate, orderId, payoutAddress, refundAddress } = swapData
    const sourceAmount = convertNativeToDisplay(walletDefaultDenomProps.multiplier)(spendTargets[0].nativeAmount)
    const destinationAmount = convertNativeToDisplay(destinationDenomination.multiplier)(swapData.payoutNativeAmount)
    const destinationCurrencyCode = destinationDenomination.name

    const createExchangeDataString = (newline: string = '\n') => {
      const uniqueIdentifier = spendTargets && spendTargets[0].uniqueIdentifier ? spendTargets[0].uniqueIdentifier : ''
      const exchangeAddresses =
        spendTargets && spendTargets.length > 0
          ? spendTargets.map((target, index) => `${target.publicAddress}${index + 1 !== spendTargets.length ? newline : ''}`).toString()
          : ''

      return `${s.strings.transaction_details_exchange_service}: ${plugin.displayName}${newline}${s.strings.transaction_details_exchange_order_id}: ${
        orderId || ''
      }${newline}${s.strings.transaction_details_exchange_source_wallet}: ${walletName}${newline}${
        s.strings.fragment_send_from_label
      }: ${sourceAmount} ${symbolString}${newline}${s.strings.string_to_capitalize}: ${destinationAmount} ${destinationCurrencyCode}${newline}${
        s.strings.transaction_details_exchange_destination_wallet
      }: ${destinationWalletName}${newline}${isEstimate ? s.strings.estimated_quote : s.strings.fixed_quote}${newline}${newline}${
        s.strings.transaction_details_exchange_exchange_address
      }:${newline}  ${exchangeAddresses}${newline}${s.strings.transaction_details_exchange_exchange_unique_id}:${newline}  ${uniqueIdentifier}${newline}${
        s.strings.transaction_details_exchange_payout_address
      }:${newline}  ${payoutAddress}${newline}${s.strings.transaction_details_exchange_refund_address}:${newline}  ${refundAddress || ''}${newline}`
    }

    const openExchangeDetails = () => {
      Airship.show(bridge => <RawTextModal bridge={bridge} body={createExchangeDataString()} title={s.strings.transaction_details_exchange_details} />)
    }

    const openUrl = () => {
      const url = swapData.orderUri
      if (Platform.OS === 'ios') {
        return (
          SafariView.isAvailable()
            // @ts-expect-error
            .then(SafariView.show({ url }))
            .catch(error => {
              // @ts-expect-error
              Linking.openURL(url)
              console.log(error)
            })
        )
      }
      // @ts-expect-error
      Linking.openURL(url)
    }

    const openEmail = () => {
      const email = swapData.plugin.supportEmail
      const body = createExchangeDataString('<br />')

      Mailer.mail(
        {
          subject: sprintf(s.strings.transaction_details_exchange_support_request, swapData.plugin.displayName),
          // @ts-expect-error
          recipients: [email],
          body,
          isHTML: true
        },
        (error, event) => {
          if (error) showError(error)
        }
      )
    }

    return (
      <>
        <Tile type="touchable" title={s.strings.transaction_details_exchange_details} onPress={openExchangeDetails}>
          <View style={styles.tileColumn}>
            <EdgeText style={styles.tileTextBottom}>{s.strings.title_exchange + ' ' + sourceAmount + ' ' + symbolString}</EdgeText>
            <EdgeText style={styles.tileTextBottom}>{s.strings.string_to_capitalize + ' ' + destinationAmount + ' ' + destinationCurrencyCode}</EdgeText>
            <EdgeText style={styles.tileTextBottom}>{swapData.isEstimate ? s.strings.estimated_quote : s.strings.fixed_quote}</EdgeText>
          </View>
        </Tile>
        {swapData.orderUri && <Tile type="touchable" title={s.strings.transaction_details_exchange_status_page} onPress={openUrl} body={swapData.orderUri} />}
        {swapData.plugin.supportEmail ? (
          <Tile type="touchable" title={s.strings.transaction_details_exchange_support} onPress={openEmail} body={swapData.plugin.supportEmail} />
        ) : null}
      </>
    )
  }

  onSaveTxDetails = (newDetails?: any) => {
    if (newDetails == null) return
    const { route, wallet } = this.props
    // @ts-expect-error
    const { contactName, notes, bizId, category, amountFiat } = { ...this.state, ...newDetails }
    const { edgeTransaction: transaction } = route.params
    let finalAmountFiat
    const decimalAmountFiat = Number.parseFloat(amountFiat.replace(',', '.'))
    if (isNaN(decimalAmountFiat)) {
      // if invalid number set to previous saved amountFiat
      finalAmountFiat = transaction.metadata ? transaction.metadata.amountFiat : 0.0
    } else {
      // if a valid number or empty string then set to zero (empty) or actual number
      finalAmountFiat = !amountFiat ? 0.0 : decimalAmountFiat
    }
    transaction.metadata = {
      name: contactName,
      category,
      notes,
      amountFiat: finalAmountFiat,
      bizId
    }
    wallet
      .saveTxMetadata(transaction.txid, transaction.currencyCode, transaction.metadata)
      .then(() => this.props.refreshTransaction(wallet.id, transaction))
      .catch(showError)

    this.setState(newDetails)
  }

  // Crypto Amount Logic
  getReceivedCryptoAmount(): FiatCryptoAmountUI {
    const { walletDefaultDenomProps, wallet, route } = this.props
    const { edgeTransaction } = route.params
    const { currencyInfo } = wallet
    const { swapData } = edgeTransaction

    const absoluteAmount = getAbsoluteAmount(edgeTransaction)
    const convertedAmount = convertNativeToDisplay(walletDefaultDenomProps.multiplier)(absoluteAmount)
    const symbolString =
      currencyInfo.currencyCode === edgeTransaction.currencyCode && walletDefaultDenomProps.symbol
        ? walletDefaultDenomProps.symbol
        : swapData?.payoutCurrencyCode ?? ''

    return {
      amountString: convertedAmount,
      symbolString,
      feeString: ''
    }
  }

  getSentCryptoAmount(): FiatCryptoAmountUI {
    const { walletDefaultDenomProps, wallet, route } = this.props
    const { edgeTransaction } = route.params
    const { currencyInfo } = wallet

    const absoluteAmount = getAbsoluteAmount(edgeTransaction)
    const symbolString =
      currencyInfo.currencyCode === edgeTransaction.currencyCode && walletDefaultDenomProps.symbol
        ? walletDefaultDenomProps.symbol
        : edgeTransaction.currencyCode

    if (edgeTransaction.networkFee) {
      const convertedAmount = convertNativeToDisplay(walletDefaultDenomProps.multiplier)(absoluteAmount)
      const convertedFee = convertNativeToDisplay(walletDefaultDenomProps.multiplier)(edgeTransaction.networkFee)
      const amountMinusFee = sub(convertedAmount, convertedFee)

      const feeAbsolute = abs(truncateDecimals(convertedFee))
      const feeString = symbolString
        ? sprintf(s.strings.fragment_tx_detail_mining_fee_with_symbol, feeAbsolute)
        : sprintf(s.strings.fragment_tx_detail_mining_fee_with_denom, feeAbsolute, walletDefaultDenomProps.name)
      return {
        amountString: amountMinusFee,
        symbolString,
        feeString
      }
    } else {
      return {
        amountString: absoluteAmount,
        symbolString,
        feeString: ''
      }
    }
  }

  // Exchange Rate Fiat
  getCurrentFiat(): FiatCurrentAmountUI {
    const { currentFiatAmount } = this.props
    const { amountFiat } = this.state

    const amount = currentFiatAmount ? toFixed(currentFiatAmount, 2, 2) : '0'
    const fiatAmount = amountFiat.replace(',', '.')
    const difference = amount ? sub(amount, fiatAmount) : '0'
    const percentageFloat = amount && gt(fiatAmount, '0') ? mul(div(difference, fiatAmount, 4), '100') : '0'
    const percentage = toFixed(percentageFloat, 2, 2)

    return {
      amount: displayFiatAmount(parseFloat(currentFiatAmount.replace(',', '.'))),
      difference,
      percentage: abs(percentage)
    }
  }

  // Render
  render() {
    const { wallet, theme, route, navigation } = this.props
    const { currencyInfo } = wallet
    const { edgeTransaction } = route.params
    const { direction, acceleratedTx, amountFiat, contactName, thumbnailPath, notes, category } = this.state
    const styles = getStyles(theme)
    const fiatCurrencyCode = wallet.fiatCurrencyCode.replace('iso:', '')

    const crypto: FiatCryptoAmountUI = direction === 'receive' ? this.getReceivedCryptoAmount() : this.getSentCryptoAmount()
    const fiatSymbol = getSymbolFromCurrency(fiatCurrencyCode)
    const fiatValue = displayFiatAmount(parseFloat(amountFiat.replace(',', '.')))
    const currentFiat: FiatCurrentAmountUI = this.getCurrentFiat()
    const personLabel = direction === 'receive' ? s.strings.transaction_details_sender : s.strings.transaction_details_recipient
    const personName = contactName && contactName !== '' ? contactName : personLabel
    const personHeader = sprintf(s.strings.transaction_details_person_name, personLabel)

    // spendTargets recipient addresses format
    let recipientsAddresses = ''
    if (edgeTransaction.spendTargets) {
      const { spendTargets } = edgeTransaction
      for (let i = 0; i < spendTargets.length; i++) {
        const newLine = i + 1 < spendTargets.length ? '\n' : ''
        recipientsAddresses = `${recipientsAddresses}${spendTargets[i].publicAddress}${newLine}`
      }
    }

    const categoriesText = formatCategory(splitCategory(category))

    // Find the currency display name:
    const { allTokens } = wallet.currencyConfig
    let currencyName = edgeTransaction.currencyCode
    if (edgeTransaction.currencyCode === currencyInfo.currencyCode) currencyName = currencyInfo.displayName
    const tokenId = Object.keys(allTokens).find(tokenId => allTokens[tokenId].currencyCode === edgeTransaction.currencyCode)
    if (tokenId != null) currencyName = allTokens[tokenId].displayName

    return (
      <SceneWrapper background="theme">
        <ScrollView>
          <View style={styles.tilesContainer}>
            <Tile type="editable" title={personHeader} onPress={this.openPersonInput}>
              <View style={styles.tileRow}>
                {thumbnailPath ? (
                  <FastImage style={styles.tileThumbnail} source={{ uri: thumbnailPath }} />
                ) : (
                  <IonIcon style={styles.tileAvatarIcon} name="person" size={theme.rem(2)} />
                )}
                <EdgeText style={styles.tileTextBottom}>{personName}</EdgeText>
              </View>
            </Tile>
            <Tile
              type="static"
              title={sprintf(s.strings.transaction_details_crypto_amount, currencyName)}
              body={`${crypto.symbolString} ${crypto.amountString}${crypto.feeString ? ` (${crypto.feeString})` : ''}`}
            />
            <Tile type="editable" title={sprintf(s.strings.transaction_details_amount_in_fiat, fiatCurrencyCode)} onPress={this.openFiatInput}>
              <View style={styles.tileRow}>
                <EdgeText style={styles.tileTextBottom}>{fiatSymbol + ' '}</EdgeText>
                <EdgeText style={styles.tileTextBottom}>{fiatValue}</EdgeText>
              </View>
            </Tile>
            <Tile type="static" title={s.strings.transaction_details_amount_current_price}>
              <View style={styles.tileRow}>
                <EdgeText style={styles.tileTextBottom}>{fiatSymbol + ' '}</EdgeText>
                <EdgeText style={styles.tileTextPrice}>{currentFiat.amount}</EdgeText>
                <EdgeText style={parseFloat(currentFiat.difference) >= 0 ? styles.tileTextPriceChangeUp : styles.tileTextPriceChangeDown}>
                  {(parseFloat(currentFiat.difference) >= 0 ? currentFiat.percentage : `- ${currentFiat.percentage}`) + '%'}
                </EdgeText>
              </View>
            </Tile>
            <Tile type="editable" title={s.strings.transaction_details_category_title} onPress={this.openCategoryInput}>
              <EdgeText style={styles.tileCategory}>{categoriesText}</EdgeText>
            </Tile>
            {edgeTransaction.spendTargets && <Tile type="copy" title={s.strings.transaction_details_recipient_addresses} body={recipientsAddresses} />}
            {this.renderExchangeData(crypto.symbolString)}
            {acceleratedTx == null ? null : (
              <Tile type="touchable" title={s.strings.transaction_details_advance_details_accelerate} onPress={this.openAccelerateModel} />
            )}
            <Tile type="editable" title={s.strings.transaction_details_notes_title} body={notes} onPress={this.openNotesInput} />
            <TouchableWithoutFeedback onPress={this.openAdvancedDetails}>
              <EdgeText style={styles.textAdvancedTransaction}>{s.strings.transaction_details_view_advanced_data}</EdgeText>
            </TouchableWithoutFeedback>
            <MainButton onPress={navigation.pop} label={s.strings.string_done_cap} marginRem={[0, 2, 2]} type="secondary" />
          </View>
        </ScrollView>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  tilesContainer: {
    flex: 1,
    width: '100%',
    flexDirection: 'column'
  },
  tileRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  tileColumn: {
    flexDirection: 'column',
    justifyContent: 'center'
  },
  tileTextBottom: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  tileAvatarIcon: {
    color: theme.primaryText,
    marginRight: theme.rem(0.5)
  },
  tileThumbnail: {
    width: theme.rem(2),
    height: theme.rem(2),
    borderRadius: theme.rem(1),
    marginRight: theme.rem(0.5)
  },
  tileTextPrice: {
    flex: 1,
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  tileTextPriceChangeUp: {
    color: theme.positiveText,
    fontSize: theme.rem(1)
  },
  tileTextPriceChangeDown: {
    color: theme.negativeText,
    fontSize: theme.rem(1)
  },
  tileCategory: {
    marginVertical: theme.rem(0.25),
    color: theme.primaryText
  },
  textAdvancedTransaction: {
    color: theme.textLink,
    marginVertical: theme.rem(1.25),
    fontSize: theme.rem(1),
    width: '100%',
    textAlign: 'center'
  }
}))

export const TransactionDetailsScene = withWallet((props: OwnProps) => {
  const { navigation, route, wallet } = props
  const { edgeTransaction } = route.params
  const theme = useTheme()
  const dispatch = useDispatch()

  const walletName = useWalletName(wallet)
  const contacts = useSelector(state => state.contacts)
  const subcategoriesList = useSelector(state => state.ui.scenes.transactionDetails.subcategories)

  const { currencyCode, swapData } = edgeTransaction
  const { currencyInfo } = wallet

  const nativeAmount = getAbsoluteAmount(edgeTransaction)

  const walletDefaultDenomProps: EdgeDenomination = useSelector(state =>
    currencyInfo.currencyCode === edgeTransaction.currencyCode
      ? getExchangeDenomination(state, currencyInfo.pluginId, currencyCode)
      : getDisplayDenomination(state, currencyInfo.pluginId, currencyCode)
  )

  const exchangeDenom = useSelector(state => getExchangeDenomination(state, currencyInfo.pluginId, currencyCode))
  const cryptoAmount = convertNativeToExchange(exchangeDenom.multiplier)(nativeAmount)
  const currentFiatAmount = useSelector(state => convertCurrencyFromExchangeRates(state.exchangeRates, currencyCode, wallet.fiatCurrencyCode, cryptoAmount))

  if (swapData != null && typeof swapData.payoutCurrencyCode === 'string') {
    swapData.payoutCurrencyCode = swapData.payoutCurrencyCode.toUpperCase()
  }
  const destinationWallet = useSelector(state => (swapData != null ? state.core.account.currencyWallets[swapData.payoutWalletId] : undefined))
  const destinationDenomination = useSelector(state =>
    swapData != null && destinationWallet != null
      ? getDisplayDenomination(state, destinationWallet.currencyInfo.pluginId, swapData.payoutCurrencyCode)
      : undefined
  )
  const destinationWalletName = destinationWallet ? getWalletName(destinationWallet) : ''

  return (
    <TransactionDetailsComponent
      navigation={navigation}
      route={route}
      contacts={contacts}
      subcategoriesList={subcategoriesList}
      currentFiatAmount={currentFiatAmount}
      getSubcategories={() => dispatch(getSubcategories())}
      refreshTransaction={(walletId: string, transaction: EdgeTransaction) => dispatch(refreshTransactionsRequest(walletId, [transaction]))}
      setNewSubcategory={async newSubcategory => dispatch(setNewSubcategory(newSubcategory))}
      theme={theme}
      wallet={wallet}
      walletName={walletName}
      walletDefaultDenomProps={walletDefaultDenomProps}
      destinationDenomination={destinationDenomination}
      destinationWalletName={destinationWalletName}
    />
  )
})
