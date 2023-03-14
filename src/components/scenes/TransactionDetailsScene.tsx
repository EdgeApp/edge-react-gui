import { EdgeCurrencyWallet, EdgeMetadata, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, TouchableWithoutFeedback, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { playSendSound } from '../../actions/SoundActions'
import { refreshTransactionsRequest } from '../../actions/TransactionListActions'
import { useContactThumbnail } from '../../hooks/redux/useContactThumbnail'
import s from '../../locales/strings'
import { useDispatch } from '../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../types/routerTypes'
import { formatCategory, joinCategory, splitCategory } from '../../util/categories'
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
import { SwapDetailsTiles } from '../tiles/SwapDetailsTiles'
import { Tile } from '../tiles/Tile'
import { TransactionCryptoAmountTile } from '../tiles/TransactionCryptoAmountTile'
import { TransactionFiatTiles } from '../tiles/TransactionFiatTiles'

interface OwnProps {
  navigation: NavigationProp<'transactionDetails'>
  route: RouteProp<'transactionDetails'>
  wallet: EdgeCurrencyWallet
}
interface StateProps {
  thumbnailPath?: string
}
interface DispatchProps {
  refreshTransaction: (walletId: string, transaction: EdgeTransaction) => void
}
type Props = OwnProps & StateProps & DispatchProps & ThemeProps

interface State {
  acceleratedTx: EdgeTransaction | null
  direction: string

  // EdgeMetadata:
  bizId: number
  category: string
  name: string
  notes: string
}

// Only exported for unit-testing purposes
class TransactionDetailsComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const { edgeTransaction } = props.route.params
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
      notes
    }
  }

  async componentDidMount() {
    const { route } = this.props
    const { edgeTransaction } = route.params

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
    Airship.show<ContactModalResult | undefined>(bridge => <ContactListModal bridge={bridge} contactType={personLabel} contactName={this.state.name} />).then(
      person => {
        if (person != null) this.onSaveTxDetails({ name: person.contactName })
      }
    )
  }

  openCategoryInput = () => {
    const { category } = this.state
    Airship.show<string | undefined>(bridge => <CategoryModal bridge={bridge} initialCategory={category} />).then(async category => {
      if (category == null) return
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

  // Render
  render() {
    const { navigation, route, theme, thumbnailPath, wallet } = this.props
    const { edgeTransaction } = route.params
    const { direction, acceleratedTx, name, notes, category } = this.state
    const styles = getStyles(theme)

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
            <TransactionCryptoAmountTile transaction={edgeTransaction} wallet={wallet} />
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

  const { metadata } = edgeTransaction

  const thumbnailPath = useContactThumbnail(metadata?.name)

  return (
    <TransactionDetailsComponent
      navigation={navigation}
      route={route}
      refreshTransaction={(walletId: string, transaction: EdgeTransaction) => dispatch(refreshTransactionsRequest(walletId, [transaction]))}
      theme={theme}
      thumbnailPath={thumbnailPath}
      wallet={wallet}
    />
  )
})
