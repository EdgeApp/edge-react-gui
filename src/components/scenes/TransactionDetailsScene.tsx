import { abs, eq } from 'biggystring'
import { EdgeCurrencyWallet, EdgeMetadata, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
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
import { toPercentString } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { convertCurrencyFromExchangeRates } from '../../selectors/WalletSelectors'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { convertNativeToExchange } from '../../util/utils'
import { getMemoTitle } from '../../util/validateMemos'
import { ButtonsContainer } from '../buttons/ButtonsContainer'
import { EdgeAnim } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { AccelerateTxModal } from '../modals/AccelerateTxModal'
import { CategoryModal } from '../modals/CategoryModal'
import { ContactListModal, ContactModalResult } from '../modals/ContactListModal'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { AdvancedDetailsCard } from '../ui4/AdvancedDetailsCard'
import { CardUi4 } from '../ui4/CardUi4'
import { RowUi4 } from '../ui4/RowUi4'
import { SwapDetailsCard } from '../ui4/SwapDetailsCard'
import { TxCryptoAmountRow } from '../ui4/TxCryptoAmountRow'

interface Props extends EdgeSceneProps<'transactionDetails'> {
  wallet: EdgeCurrencyWallet
}

export interface TransactionDetailsParams {
  edgeTransaction: EdgeTransaction
  walletId: string
}

const TransactionDetailsComponent = (props: Props) => {
  const { navigation, route, wallet } = props
  const { edgeTransaction: transaction, walletId } = route.params
  const { currencyCode, metadata = {}, chainAssetAction, nativeAmount, date, tokenId, txid } = transaction
  const { currencyInfo } = wallet

  const theme = useTheme()
  const styles = getStyles(theme)
  const thumbnailPath = useContactThumbnail(metadata?.name)
  // Choose a default category based on metadata or the txAction
  const txActionInfo = getTxActionDisplayInfo(transaction, wallet, tokenId)
  const txActionSplitCat = txActionInfo?.edgeCategory
  const txActionNotes = txActionInfo?.notes
  const txActionDir = txActionInfo?.direction

  const isSentTransaction = transaction.nativeAmount.startsWith('-') || (eq(transaction.nativeAmount, '0') && transaction.isSend)

  // Determine direction from transaction nativeAmount if not specified in
  const direction = txActionDir ?? isSentTransaction ? 'send' : 'receive'

  const splitCat =
    metadata?.category != null || txActionSplitCat == null
      ? splitCategory(
          metadata?.category ?? undefined,
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

  const name = localMetadata.name ?? ''

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
  const metadataFiat = metadata.exchangeAmount?.[wallet.fiatCurrencyCode]
  const originalFiat = metadataFiat == null || metadataFiat === 0 ? historicFiat : Math.abs(metadataFiat)

  // Percent difference:
  const percentChange = originalFiat === 0 ? 0 : (currentFiat - originalFiat) / originalFiat

  // Convert to text:
  const originalFiatText = displayFiatAmount(originalFiat)
  const currentFiatText = displayFiatAmount(currentFiat)
  const percentText = toPercentString(percentChange, { plusSign: true, maxPrecision: 2 })

  const handleEdit = useHandler(() => {
    Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        initialValue={originalFiatText}
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
        await onSaveTxDetails({ exchangeAmount: { [wallet.fiatCurrencyCode]: amountFiat } })
      })
      .catch(showError)
  })

  // #endregion Crypto Fiat Rows

  React.useEffect(() => {
    // Try accelerating transaction to check if transaction can be accelerated
    if (typeof wallet.accelerate === 'function') {
      wallet
        .accelerate(transaction)
        .then(acceleratedTx => {
          setAcceleratedTx(acceleratedTx)
        })
        .catch(_err => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          walletId
        })
      }
    } catch (err: any) {
      if (err?.message === 'transaction underpriced') {
        const newAcceleratedTx = await wallet.accelerate(acceleratedTx)
        setAcceleratedTx(newAcceleratedTx)
        showError(lstrings.transaction_details_accelerate_transaction_fee_too_low)
        return
      }
      showError(err)
    }
  }

  const onSaveTxDetails = (newDetails: Partial<EdgeMetadata>) => {
    const mergedMetadata = {
      ...localMetadata,
      ...newDetails,
      exchangeAmount: {
        ...localMetadata.exchangeAmount,
        ...newDetails.exchangeAmount
      }
    }
    transaction.metadata = mergedMetadata

    wallet
      .saveTxMetadata({
        txid: transaction.txid,
        tokenId: transaction.tokenId,
        metadata: transaction.metadata
      })
      .catch(error => showError(error))

    setLocalMetadata(mergedMetadata)
  }

  const personLabel = direction === 'receive' ? lstrings.transaction_details_sender : lstrings.transaction_details_recipient
  const personName = chainAssetAction != null ? TX_ACTION_LABEL_MAP[chainAssetAction.assetActionType] : name !== '' ? name : personLabel
  const personHeader = sprintf(lstrings.transaction_details_person_name, personLabel)

  // spendTargets recipient addresses format
  let recipientsAddresses = ''
  if (transaction.spendTargets != null) {
    const { spendTargets } = transaction
    for (let i = 0; i < spendTargets.length; i++) {
      const newLine = i + 1 < spendTargets.length ? '\n' : ''
      recipientsAddresses = `${recipientsAddresses}${spendTargets[i].publicAddress}${newLine}`
    }
  }

  const categoriesText = formatCategory(splitCategory(category))

  return (
    <SceneWrapper hasNotifications hasTabs scroll padding={theme.rem(0.5)}>
      <EdgeAnim enter={{ type: 'fadeInUp', distance: 80 }}>
        <CardUi4>
          <RowUi4
            rightButtonType="editable"
            icon={
              thumbnailPath ? (
                <FastImage style={styles.tileThumbnail} source={{ uri: thumbnailPath }} />
              ) : (
                <IonIcon style={styles.tileAvatarIcon} name="person" size={theme.rem(2)} />
              )
            }
            title={personHeader}
            onPress={openPersonInput}
          >
            <EdgeText>{personName}</EdgeText>
          </RowUi4>
        </CardUi4>
      </EdgeAnim>

      <EdgeAnim enter={{ type: 'fadeInUp', distance: 40 }}>
        <CardUi4 sections>
          <TxCryptoAmountRow transaction={transaction} wallet={wallet} />
          <RowUi4 rightButtonType="editable" title={sprintf(lstrings.transaction_details_amount_in_fiat, fiatCurrencyCode)} onPress={handleEdit}>
            <View style={styles.tileRow}>
              <EdgeText>{fiatSymbol + ' '}</EdgeText>
              <EdgeText>{originalFiatText}</EdgeText>
            </View>
          </RowUi4>
          <RowUi4 rightButtonType="none" title={lstrings.transaction_details_amount_current_price}>
            <View style={styles.tileRow}>
              <EdgeText>{fiatSymbol + ' '}</EdgeText>
              <EdgeText style={styles.tileTextPrice}>{currentFiatText}</EdgeText>
              {originalFiatText === currentFiatText ? null : (
                <EdgeText style={percentChange >= 0 ? styles.tileTextPriceChangeUp : styles.tileTextPriceChangeDown}>{` (${percentText})`}</EdgeText>
              )}
            </View>
          </RowUi4>
          <RowUi4 rightButtonType="copy" title={lstrings.transaction_details_tx_id_modal_title} body={txid} />
          {acceleratedTx == null ? null : (
            <RowUi4 rightButtonType="touchable" title={lstrings.transaction_details_advance_details_accelerate} onPress={openAccelerateModel} />
          )}
        </CardUi4>
      </EdgeAnim>

      <EdgeAnim enter={{ type: 'fadeInDown', distance: 40 }}>
        <CardUi4 sections>
          <RowUi4 rightButtonType="editable" title={lstrings.transaction_details_category_title} onPress={openCategoryInput}>
            <EdgeText style={styles.tileCategory}>{categoriesText}</EdgeText>
          </RowUi4>
          <RowUi4
            rightButtonType="editable"
            title={lstrings.transaction_details_notes_title}
            body={notes == null || notes.trim() === '' ? lstrings.transaction_details_empty_note_placeholder : notes}
            onPress={openNotesInput}
          />
          {transaction.memos?.map((memo, i) =>
            memo.hidden === true ? null : <RowUi4 body={memo.value} key={`memo${i}`} title={getMemoTitle(memo.memoName)} rightButtonType="copy" />
          )}
        </CardUi4>
      </EdgeAnim>

      {transaction.spendTargets == null ? null : (
        <EdgeAnim enter={{ type: 'fadeInDown', distance: 60 }}>
          <CardUi4>
            <RowUi4 rightButtonType="copy" title={lstrings.transaction_details_recipient_addresses} body={recipientsAddresses} />
          </CardUi4>
        </EdgeAnim>
      )}

      <EdgeAnim enter={{ type: 'fadeInDown', distance: 80 }}>
        {transaction.swapData == null ? null : <SwapDetailsCard swapData={transaction.swapData} transaction={transaction} wallet={wallet} />}
      </EdgeAnim>
      <EdgeAnim enter={{ type: 'fadeInDown', distance: 100 }}>
        <AdvancedDetailsCard transaction={transaction} url={sprintf(wallet.currencyInfo.transactionExplorer, transaction.txid)} />
      </EdgeAnim>
      <EdgeAnim enter={{ type: 'fadeInDown', distance: 120 }}>
        <ButtonsContainer
          layout="column"
          primary={{
            onPress: navigation.pop,
            label: lstrings.string_done_cap
          }}
          scrollMargin
        />
      </EdgeAnim>
    </SceneWrapper>
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

export const TransactionDetailsScene = withWallet(TransactionDetailsComponent)
