import { abs, div, gt, mul, sub, toFixed } from 'biggystring'
import { EdgeCurrencyWallet, EdgeDenomination, EdgeMetadata, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, TouchableWithoutFeedback, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { playSendSound } from '../../actions/SoundActions'
import { getSubcategories, setNewSubcategory } from '../../actions/TransactionDetailsActions'
import { refreshTransactionsRequest } from '../../actions/TransactionListActions'
import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { displayFiatAmount } from '../../hooks/useFiatText'
import s from '../../locales/strings'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { convertCurrencyFromExchangeRates } from '../../selectors/WalletSelectors'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../types/routerTypes'
import { GuiContact } from '../../types/types'
import { formatCategory, joinCategory, splitCategory } from '../../util/categories'
import { getHistoricalRate } from '../../util/exchangeRates'
import { convertNativeToDisplay, convertNativeToExchange, truncateDecimals } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { AccelerateTxModal } from '../modals/AccelerateTxModal'
import { AdvancedDetailsModal } from '../modals/AdvancedDetailsModal'
import { CategoryModal } from '../modals/CategoryModal'
import { ContactListModal, ContactModalResult } from '../modals/ContactListModal'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { SwapDetailsTiles } from '../themed/SwapDetailsTiles'
import { Tile } from '../tiles/Tile'

interface OwnProps {
  navigation: NavigationProp<'transactionDetails'>
  route: RouteProp<'transactionDetails'>
  wallet: EdgeCurrencyWallet
}
interface StateProps {
  contacts: GuiContact[]
  currentFiatAmount: string
  subcategoriesList: string[]
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
  direction: string
  thumbnailPath?: string

  // EdgeMetadata:
  amountFiat: number
  bizId: number
  category: string
  name: string
  notes: string
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
    const { amountFiat: defaultAmountFiat = 0, edgeTransaction, thumbnailPath } = props.route.params
    const { metadata = {} } = edgeTransaction
    const { name = '', notes = '', amountFiat = defaultAmountFiat } = metadata
    const direction = parseInt(edgeTransaction.nativeAmount) >= 0 ? 'receive' : 'send'
    const category = joinCategory(
      splitCategory(
        metadata.category,
        // Pick the right default:
        direction === 'receive' ? 'income' : 'expense'
      )
    )

    this.state = {
      acceleratedTx: null,
      amountFiat,
      bizId: 0,
      category,
      name,
      direction,
      notes,
      thumbnailPath
    }
  }

  async componentDidMount() {
    const { amountFiat } = this.state
    const { route, wallet } = this.props
    const { edgeTransaction } = route.params

    this.props.getSubcategories()

    if (amountFiat === 0) {
      const { currencyCode, date, nativeAmount } = edgeTransaction
      const isoDate = new Date(date * 1000).toISOString()

      const exchangeAmount = await wallet.nativeToDenomination(nativeAmount, currencyCode)
      const isoRate = await getHistoricalRate(`${currencyCode}_${wallet.fiatCurrencyCode}`, isoDate)
      this.setState({ amountFiat: isoRate * Number(exchangeAmount) })
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
      <ContactListModal bridge={bridge} contactType={personLabel} contactName={this.state.name} contacts={this.props.contacts} />
    )).then(person => {
      if (person != null) this.onSaveTxDetails({ name: person.contactName })
    })
  }

  openFiatInput = () => {
    const { wallet } = this.props
    const fiatCurrencyCode = wallet.fiatCurrencyCode.replace('iso:', '')
    Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        initialValue={displayFiatAmount(this.state.amountFiat)}
        inputLabel={fiatCurrencyCode}
        returnKeyType="done"
        keyboardType="numeric"
        submitLabel={s.strings.string_save}
        title={sprintf(s.strings.transaction_details_amount_in_fiat, fiatCurrencyCode)}
      />
    )).then(amountText => {
      if (amountText == null) return
      const amountFiat = parseFloat(amountText.replace(',', '.'))

      // Check for NaN, Infinity, and 0:
      if (amountFiat === 0 || JSON.stringify(amountFiat) == null) return
      this.onSaveTxDetails({ amountFiat })
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

  onSaveTxDetails = (newDetails: Partial<EdgeMetadata>) => {
    const { route, wallet } = this.props
    const { edgeTransaction: transaction } = route.params

    const { name, notes, bizId, category, amountFiat } = { ...this.state, ...newDetails }
    transaction.metadata = {
      name,
      category,
      notes,
      amountFiat,
      bizId
    }

    wallet
      .saveTxMetadata(transaction.txid, transaction.currencyCode, transaction.metadata)
      .then(() => this.props.refreshTransaction(wallet.id, transaction))
      .catch(showError)

    this.setState({ ...this.state, ...newDetails })
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
    const fiatAmount = amountFiat.toFixed(8)
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
    const { direction, acceleratedTx, amountFiat, name, thumbnailPath, notes, category } = this.state
    const styles = getStyles(theme)
    const fiatCurrencyCode = wallet.fiatCurrencyCode.replace('iso:', '')

    const crypto: FiatCryptoAmountUI = direction === 'receive' ? this.getReceivedCryptoAmount() : this.getSentCryptoAmount()
    const fiatSymbol = getSymbolFromCurrency(fiatCurrencyCode)
    const fiatValue = displayFiatAmount(amountFiat)
    const currentFiat: FiatCurrentAmountUI = this.getCurrentFiat()
    const personLabel = direction === 'receive' ? s.strings.transaction_details_sender : s.strings.transaction_details_recipient
    const personName = name !== '' ? name : personLabel
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
            {edgeTransaction.swapData == null ? null : <SwapDetailsTiles swapData={edgeTransaction.swapData} transaction={edgeTransaction} wallet={wallet} />}
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

  const contacts = useSelector(state => state.contacts)
  const subcategoriesList = useSelector(state => state.ui.scenes.transactionDetails.subcategories)

  const { currencyCode } = edgeTransaction
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
      walletDefaultDenomProps={walletDefaultDenomProps}
    />
  )
})
