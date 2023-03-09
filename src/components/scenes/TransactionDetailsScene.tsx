import { abs, sub } from 'biggystring'
import { EdgeCurrencyWallet, EdgeDenomination, EdgeMetadata, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, TouchableWithoutFeedback, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { playSendSound } from '../../actions/SoundActions'
import { getSubcategories, setNewSubcategory } from '../../actions/TransactionDetailsActions'
import { refreshTransactionsRequest } from '../../actions/TransactionListActions'
import s from '../../locales/strings'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../types/routerTypes'
import { GuiContact } from '../../types/types'
import { formatCategory, joinCategory, splitCategory } from '../../util/categories'
import { convertNativeToDisplay, truncateDecimals } from '../../util/utils'
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
import { TransactionFiatTiles } from '../tiles/TransactionFiatTiles'

interface OwnProps {
  navigation: NavigationProp<'transactionDetails'>
  route: RouteProp<'transactionDetails'>
  wallet: EdgeCurrencyWallet
}
interface StateProps {
  contacts: GuiContact[]
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

const getAbsoluteAmount = (edgeTransaction: EdgeTransaction): string =>
  edgeTransaction && edgeTransaction.nativeAmount ? abs(edgeTransaction.nativeAmount) : ''

// Only exported for unit-testing purposes
class TransactionDetailsComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const { edgeTransaction, thumbnailPath } = props.route.params
    const { metadata = {} } = edgeTransaction
    const { name = '', notes = '' } = metadata
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
      bizId: 0,
      category,
      name,
      direction,
      notes,
      thumbnailPath
    }
  }

  async componentDidMount() {
    const { route } = this.props
    const { edgeTransaction } = route.params

    this.props.getSubcategories()

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

  // Render
  render() {
    const { wallet, theme, route, navigation } = this.props
    const { currencyInfo } = wallet
    const { edgeTransaction } = route.params
    const { direction, acceleratedTx, name, thumbnailPath, notes, category } = this.state
    const styles = getStyles(theme)

    const crypto: FiatCryptoAmountUI = direction === 'receive' ? this.getReceivedCryptoAmount() : this.getSentCryptoAmount()
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
                <EdgeText>{personName}</EdgeText>
              </View>
            </Tile>
            <Tile
              type="static"
              title={sprintf(s.strings.transaction_details_crypto_amount, currencyName)}
              body={`${crypto.symbolString} ${crypto.amountString}${crypto.feeString ? ` (${crypto.feeString})` : ''}`}
            />
            <TransactionFiatTiles transaction={edgeTransaction} wallet={wallet} onMetadataEdit={this.onSaveTxDetails} />
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

  const walletDefaultDenomProps: EdgeDenomination = useSelector(state =>
    currencyInfo.currencyCode === edgeTransaction.currencyCode
      ? getExchangeDenomination(state, currencyInfo.pluginId, currencyCode)
      : getDisplayDenomination(state, currencyInfo.pluginId, currencyCode)
  )

  return (
    <TransactionDetailsComponent
      navigation={navigation}
      route={route}
      contacts={contacts}
      subcategoriesList={subcategoriesList}
      getSubcategories={() => dispatch(getSubcategories())}
      refreshTransaction={(walletId: string, transaction: EdgeTransaction) => dispatch(refreshTransactionsRequest(walletId, [transaction]))}
      setNewSubcategory={async newSubcategory => dispatch(setNewSubcategory(newSubcategory))}
      theme={theme}
      wallet={wallet}
      walletDefaultDenomProps={walletDefaultDenomProps}
    />
  )
})
