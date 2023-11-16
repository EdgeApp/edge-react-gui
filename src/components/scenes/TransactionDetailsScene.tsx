import { abs, eq } from 'biggystring'
import { EdgeCurrencyWallet, EdgeMetadata, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { formatCategory, getTxActionDisplayInfo, joinCategory, splitCategory } from '../../actions/CategoriesActions'
import { playSendSound } from '../../actions/SoundActions'
import { TX_ACTION_LABEL_MAP } from '../../constants/txActionConstants'
import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { useContactThumbnail } from '../../hooks/redux/useContactThumbnail'
import { displayFiatAmount } from '../../hooks/useFiatText'
import { useHandler } from '../../hooks/useHandler'
import { useHistoricalRate } from '../../hooks/useHistoricalRate'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { convertCurrencyFromExchangeRates } from '../../selectors/WalletSelectors'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { convertNativeToExchange } from '../../util/utils'
import { getMemoTitle } from '../../util/validateMemos'
import { NotificationSceneWrapper } from '../common/SceneWrapper'
import { AccelerateTxModal } from '../modals/AccelerateTxModal'
import { AdvancedDetailsModal } from '../modals/AdvancedDetailsModal'
import { CategoryModal } from '../modals/CategoryModal'
import { ContactListModal, ContactModalResult } from '../modals/ContactListModal'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { SwapDetailsTiles } from '../tiles/SwapDetailsTiles'
import { TransactionCryptoAmountTile } from '../tiles/TransactionCryptoAmountTile'
import { CardUi4 } from '../ui4/CardUi4'
import { RowUi4 } from '../ui4/RowUi4'

interface Props extends EdgeSceneProps<'transactionDetails'> {}

export interface TransactionDetailsParams {
  edgeTransaction: EdgeTransaction
  wallet: EdgeCurrencyWallet
  tokenId?: string
}

export const TransactionDetailsScene = (props: Props) => {
  const { navigation, route } = props
  const { edgeTransaction: transaction, tokenId, wallet } = route.params
  const { metadata = {}, action, nativeAmount, date, currencyCode } = transaction
  const { currencyInfo } = wallet

  const theme = useTheme()
  const styles = getStyles(theme)
  const thumbnailPath = useContactThumbnail(metadata?.name)

  const isSentTransaction = transaction.nativeAmount.startsWith('-') || (eq(transaction.nativeAmount, '0') && transaction.isSend)

  // Choose a default category based on metadata or the txAction
  const txActionInfo = getTxActionDisplayInfo(transaction, wallet, tokenId)
  const txActionSplitCat = txActionInfo?.splitCategory
  const txActionNotes = txActionInfo?.notes
  const txActionDir = txActionInfo?.direction

  // Determine direction from transaction nativeAmount if not specified in
  // txActionInfo
  const direction = txActionDir ?? isSentTransaction ? 'send' : 'receive'

  const splitCat =
    metadata?.category != null || txActionSplitCat == null
      ? splitCategory(
          metadata?.category,
          // Pick the right default:
          direction === 'receive' ? 'income' : 'expense'
        )
      : txActionSplitCat

  const category = joinCategory(splitCat)

  const notes = metadata?.notes == null ? txActionNotes : metadata.notes

  const [localMetadata, setLocalMetadata] = React.useState<EdgeMetadata>({
    bizId: 0,
    category,
    name: metadata?.name ?? '',
    notes: notes ?? ''
  })
  const [acceleratedTx, setAcceleratedTx] = React.useState<null | EdgeTransaction>(null)

  const { name = '' } = localMetadata

  // #region Crypto Fiat Rows

  // Look up wallet stuff:
  const isoFiatCurrencyCode = useWatch(wallet, 'fiatCurrencyCode')
  const fiatCurrencyCode = isoFiatCurrencyCode.replace('iso:', '')
  const fiatSymbol = getSymbolFromCurrency(fiatCurrencyCode)

  // Look up transaction stuff:
  const absoluteAmount = abs(nativeAmount)

  // Look up the current price:
  const exchangeDenom = useSelector(state => getExchangeDenomination(state, currencyInfo.pluginId, currencyCode))
  const absExchangeAmount = convertNativeToExchange(exchangeDenom.multiplier)(absoluteAmount)
  const currentFiat = useSelector(state =>
    parseFloat(convertCurrencyFromExchangeRates(state.exchangeRates, currencyCode, isoFiatCurrencyCode, absExchangeAmount))
  )

  // Look up the historical price:
  const isoDate = new Date(date * 1000).toISOString()
  const historicRate = useHistoricalRate(`${currencyCode}_${isoFiatCurrencyCode}`, isoDate)
  const historicFiat = historicRate * Number(absExchangeAmount)

  // Figure out which amount to show:
  const displayFiat = metadata.amountFiat == null || metadata.amountFiat === 0 ? historicFiat : Math.abs(metadata.amountFiat)

  // Percent difference:
  const percentChange = displayFiat === 0 ? 0 : (100 * (currentFiat - displayFiat)) / displayFiat

  // Convert to text:
  const currentFiatText = displayFiatAmount(currentFiat)
  const displayFiatText = displayFiatAmount(displayFiat)
  const percentText = abs(percentChange.toFixed(2))

  const handleEdit = useHandler(() => {
    Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        initialValue={displayFiatText}
        inputLabel={fiatCurrencyCode}
        returnKeyType="done"
        keyboardType="numeric"
        submitLabel={lstrings.string_save}
        title={sprintf(lstrings.transaction_details_amount_in_fiat, fiatCurrencyCode)}
      />
    ))
      .then(async inputText => {
        if (inputText == null) return
        const amountFiat = parseFloat(inputText.replace(',', '.'))

        // Check for NaN, Infinity, and 0:
        if (amountFiat === 0 || JSON.stringify(amountFiat) === 'null') return
        await onSaveTxDetails({ amountFiat })
      })
      .catch(showError)
  })

  // #endregion Crypto Fiat Rows

  React.useEffect(() => {
    // Try accelerating transaction to check if transaction can be accelerated
    makeAcceleratedTx(transaction)
      .then(acceleratedTx => {
        setAcceleratedTx(acceleratedTx)
      })
      .catch(_err => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const makeAcceleratedTx = async (transaction: EdgeTransaction): Promise<EdgeTransaction | null> => {
    return await wallet.accelerate(transaction)
  }

  const openPersonInput = async () => {
    const personLabel = direction === 'receive' ? lstrings.transaction_details_payer : lstrings.transaction_details_payee
    const person = await Airship.show<ContactModalResult | undefined>(bridge => (
      <ContactListModal bridge={bridge} contactType={personLabel} contactName={name} />
    ))
    if (person != null) onSaveTxDetails({ name: person.contactName })
  }

  const openCategoryInput = async () => {
    const newCategory = await Airship.show<string | undefined>(bridge => <CategoryModal bridge={bridge} initialCategory={category} />)
    if (newCategory == null) return
    onSaveTxDetails({ category: newCategory })
  }

  const openNotesInput = async () => {
    const notes = await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        initialValue={notes}
        inputLabel={lstrings.transaction_details_notes_title}
        multiline
        submitLabel={lstrings.string_save}
        title={lstrings.transaction_details_notes_title}
      />
    ))
    if (notes != null) onSaveTxDetails({ notes })
  }

  const openAccelerateModel = async () => {
    if (acceleratedTx == null) {
      throw new Error('Missing accelerated transaction data.')
    }

    try {
      const signedTx = await Airship.show<EdgeTransaction | null>(bridge => (
        <AccelerateTxModal bridge={bridge} acceleratedTx={acceleratedTx} replacedTx={transaction} wallet={wallet} />
      ))

      if (signedTx != null) {
        playSendSound().catch(error => console.log(error))
        showToast(lstrings.transaction_details_accelerate_transaction_sent)

        navigation.pop()
        navigation.push('transactionDetails', {
          edgeTransaction: signedTx,
          wallet
        })
      }
    } catch (err: any) {
      if (err?.message === 'transaction underpriced') {
        const newAcceleratedTx = await makeAcceleratedTx(acceleratedTx)
        setAcceleratedTx(newAcceleratedTx)
        showError(lstrings.transaction_details_accelerate_transaction_fee_too_low)
        return
      }
      showError(err)
    }
  }

  const openAdvancedDetails = () => {
    Airship.show(bridge => (
      <AdvancedDetailsModal bridge={bridge} transaction={transaction} url={sprintf(wallet.currencyInfo.transactionExplorer, transaction.txid)} />
    )).catch(err => showError(err))
  }

  const onSaveTxDetails = (newDetails: Partial<EdgeMetadata>) => {
    const { name, notes, bizId, category, amountFiat } = { ...localMetadata, ...newDetails }
    transaction.metadata = {
      name,
      category,
      notes,
      amountFiat,
      bizId
    }

    wallet.saveTxMetadata(transaction.txid, transaction.currencyCode, transaction.metadata).catch(error => showError(error))

    setLocalMetadata({ ...localMetadata, ...newDetails })
  }

  const personLabel = direction === 'receive' ? lstrings.transaction_details_sender : lstrings.transaction_details_recipient
  const personName = action != null ? TX_ACTION_LABEL_MAP[action.type] : name !== '' ? name : personLabel
  const personHeader = sprintf(lstrings.transaction_details_person_name, personLabel)

  // spendTargets recipient addresses format
  let recipientsAddresses = ''
  if (transaction.spendTargets) {
    const { spendTargets } = transaction
    for (let i = 0; i < spendTargets.length; i++) {
      const newLine = i + 1 < spendTargets.length ? '\n' : ''
      recipientsAddresses = `${recipientsAddresses}${spendTargets[i].publicAddress}${newLine}`
    }
  }

  const categoriesText = formatCategory(splitCategory(category))

  return (
    <NotificationSceneWrapper navigation={navigation} hasTabs scroll>
      <CardUi4>
        <RowUi4 type="editable" title={personHeader} onPress={openPersonInput}>
          <View style={styles.tileRow}>
            {thumbnailPath ? (
              <FastImage style={styles.tileThumbnail} source={{ uri: thumbnailPath }} />
            ) : (
              <IonIcon style={styles.tileAvatarIcon} name="person" size={theme.rem(2)} />
            )}
            <EdgeText>{personName}</EdgeText>
          </View>
        </RowUi4>
      </CardUi4>

      <CardUi4>
        <TransactionCryptoAmountTile transaction={transaction} wallet={wallet} />
        <RowUi4 type="editable" title={sprintf(lstrings.transaction_details_amount_in_fiat, fiatCurrencyCode)} onPress={handleEdit}>
          <View style={styles.tileRow}>
            <EdgeText>{fiatSymbol + ' '}</EdgeText>
            <EdgeText>{displayFiatText}</EdgeText>
          </View>
        </RowUi4>
        <RowUi4 type="default" title={lstrings.transaction_details_amount_current_price}>
          <View style={styles.tileRow}>
            <EdgeText>{fiatSymbol + ' '}</EdgeText>
            <EdgeText style={styles.tileTextPrice}>{currentFiatText}</EdgeText>
            <EdgeText style={percentChange >= 0 ? styles.tileTextPriceChangeUp : styles.tileTextPriceChangeDown}>
              {(percentChange >= 0 ? percentText : `- ${percentText}`) + '%'}
            </EdgeText>
          </View>
        </RowUi4>
        {acceleratedTx == null ? null : (
          <RowUi4 type="touchable" title={lstrings.transaction_details_advance_details_accelerate} onPress={openAccelerateModel} />
        )}
      </CardUi4>

      <CardUi4>
        <RowUi4 type="editable" title={lstrings.transaction_details_category_title} onPress={openCategoryInput}>
          <EdgeText style={styles.tileCategory}>{categoriesText}</EdgeText>
        </RowUi4>
        <RowUi4 type="editable" title={lstrings.transaction_details_notes_title} body={notes ?? ''} onPress={openNotesInput} />
        {transaction.memos?.map((memo, i) =>
          memo.hidden === true ? null : <RowUi4 body={memo.value} key={`memo${i}`} title={getMemoTitle(memo.memoName)} type="copy" />
        )}
      </CardUi4>

      <CardUi4>
        {transaction.spendTargets == null ? null : <RowUi4 type="copy" title={lstrings.transaction_details_recipient_addresses} body={recipientsAddresses} />}
      </CardUi4>

      {transaction.swapData == null ? null : <SwapDetailsTiles swapData={transaction.swapData} transaction={transaction} wallet={wallet} />}

      <TouchableWithoutFeedback onPress={openAdvancedDetails}>
        <EdgeText style={styles.textAdvancedTransaction}>{lstrings.transaction_details_view_advanced_data}</EdgeText>
      </TouchableWithoutFeedback>
      <MainButton onPress={navigation.pop} label={lstrings.string_done_cap} marginRem={[0, 2, 2]} type="secondary" />
    </NotificationSceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
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
  textAdvancedTransaction: {
    color: theme.textLink,
    marginVertical: theme.rem(1.25),
    fontSize: theme.rem(1),
    width: '100%',
    textAlign: 'center'
  }
}))
