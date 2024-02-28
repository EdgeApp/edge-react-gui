import { abs } from 'biggystring'
import { EdgeAccount, EdgeCurrencyWallet, EdgeMetadata, EdgeMetadataChange, EdgeSaveTxMetadataOptions, EdgeTransaction, EdgeTxSwap } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { formatCategory, getTxActionDisplayInfo, pluginIdIcons, splitCategory } from '../../actions/CategoriesActions'
import { playSendSound } from '../../actions/SoundActions'
import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { useContactThumbnail } from '../../hooks/redux/useContactThumbnail'
import { displayFiatAmount } from '../../hooks/useFiatText'
import { useHandler } from '../../hooks/useHandler'
import { useHistoricalRate } from '../../hooks/useHistoricalRate'
import { useIconColor } from '../../hooks/useIconColor'
import { useWatch } from '../../hooks/useWatch'
import { toPercentString } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { getExchangeDenom } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { getCurrencyCodeWithAccount } from '../../util/CurrencyInfoHelpers'
import { matchJson } from '../../util/matchJson'
import { convertCurrencyFromExchangeRates, convertNativeToExchange, darkenHexColor } from '../../util/utils'
import { getMemoTitle } from '../../util/validateMemos'
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
import { ButtonsViewUi4 } from '../ui4/ButtonsViewUi4'
import { CardUi4 } from '../ui4/CardUi4'
import { AccentColors } from '../ui4/DotsBackground'
import { FiatExchangeDetailsCard } from '../ui4/FiatExchangeDetailsCard'
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
  const { currencyCode, metadata, nativeAmount, date, txid, tokenId } = transaction
  const { currencyInfo } = wallet

  const theme = useTheme()
  const account = useSelector(state => state.core.account)
  const styles = getStyles(theme)
  const iconColor = useIconColor({ pluginId: currencyInfo.pluginId, tokenId })

  // Choose a default category based on metadata or the txAction
  const { action, assetAction, direction, iconPluginId, mergedData, savedData } = getTxActionDisplayInfo(transaction, account, wallet)

  const swapData = convertActionToSwapData(account, transaction) ?? transaction.swapData

  const thumbnailPath = useContactThumbnail(mergedData.name) ?? pluginIdIcons[iconPluginId ?? '']
  const iconSource = React.useMemo(() => ({ uri: thumbnailPath }), [thumbnailPath])

  const [localMetadata, setLocalMetadata] = React.useState<EdgeMetadata>({
    exchangeAmount: metadata?.exchangeAmount,
    bizId: 0,
    category: mergedData?.category,
    name: mergedData.name ?? '',
    notes: mergedData.notes ?? ''
  })
  const [acceleratedTx, setAcceleratedTx] = React.useState<null | EdgeTransaction>(null)

  // #region Crypto Fiat Rows

  // Look up wallet stuff:
  const isoFiatCurrencyCode = useWatch(wallet, 'fiatCurrencyCode')
  const fiatCurrencyCode = isoFiatCurrencyCode.replace('iso:', '')
  const fiatSymbol = getSymbolFromCurrency(fiatCurrencyCode)

  // Look up transaction stuff:
  const absoluteAmount = abs(nativeAmount)

  // Look up the current price:
  const exchangeDenom = getExchangeDenom(wallet.currencyConfig, tokenId)
  const absExchangeAmount = convertNativeToExchange(exchangeDenom.multiplier)(absoluteAmount)
  const currentFiat = useSelector(state =>
    parseFloat(convertCurrencyFromExchangeRates(state.exchangeRates, currencyCode, isoFiatCurrencyCode, absExchangeAmount))
  )

  // Look up the historical price:
  const isoDate = new Date(date * 1000).toISOString()
  const historicRate = useHistoricalRate(`${currencyCode}_${isoFiatCurrencyCode}`, isoDate)
  const historicFiat = historicRate * Number(absExchangeAmount)

  // Figure out which amount to show:
  const metadataFiat = localMetadata.exchangeAmount?.[wallet.fiatCurrencyCode]
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
        if (inputText === '') {
          // Setting amountFiat to 0 will cause GUI to load dynamic exchange rate
          inputText = '0'
        }
        const amountFiat = parseFloat(inputText.replace(',', '.'))

        // Check for NaN, Infinity, and 0:
        if (JSON.stringify(amountFiat) === 'null') return

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
    const person = await Airship.show<ContactModalResult | undefined>(bridge => (
      <ContactListModal bridge={bridge} contactType={personLabel} contactName={localMetadata.name ?? ''} />
    ))
    if (person != null) onSaveTxDetails({ name: person.contactName })
  }

  const openCategoryInput = async () => {
    const newCategory = await Airship.show<string | undefined>(bridge => <CategoryModal bridge={bridge} initialCategory={localMetadata.category ?? ''} />)
    if (newCategory == null) return
    onSaveTxDetails({ category: newCategory })
  }

  const openNotesInput = async () => {
    const notes = await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        initialValue={localMetadata.notes}
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
    const newValues: EdgeMetadata = { ...localMetadata, ...newDetails, exchangeAmount: { ...localMetadata.exchangeAmount, ...newDetails.exchangeAmount } }
    const { name, notes, category, exchangeAmount } = newValues

    let newName, newCategory, newNotes, newExchangeAmount
    let changed = false

    if (name !== localMetadata.name) {
      changed = true
      if (name === savedData.name || name === '') {
        // The updated name matches data from savedAction or chainAction so delete
        // any user edited metadata so we just fallback. Also applies to category and
        // notes.
        newName = null
        newDetails.name = savedData.name
      } else {
        newName = name
      }
    }

    if (category !== localMetadata.category) {
      changed = true
      const lowerCat = category?.toLowerCase()
      if (category === savedData.category || (lowerCat === 'income:' && direction === 'receive') || (lowerCat === 'expense:' && direction === 'send')) {
        newCategory = null
        newDetails.category = savedData.category
      } else {
        newCategory = category
      }
    }

    if (notes !== localMetadata.notes) {
      changed = true
      if (notes === savedData.notes || notes === '') {
        newNotes = null
        newDetails.notes = savedData.notes
      } else {
        newNotes = notes
      }
    }

    if (!matchJson(exchangeAmount, localMetadata.exchangeAmount)) {
      changed = true
      newExchangeAmount = exchangeAmount
    }

    if (!changed) {
      console.log('EXIT onSaveTxDetails no change')
      return
    }
    const metadata: EdgeMetadataChange = {
      name: newName,
      category: newCategory,
      notes: newNotes,
      exchangeAmount: newExchangeAmount
    }

    const saveTxMetadataParams: EdgeSaveTxMetadataOptions = {
      txid: transaction.txid,
      tokenId: transaction.tokenId,
      metadata: metadata
    }

    wallet.saveTxMetadata(saveTxMetadataParams).catch(error => showError(error))

    setLocalMetadata(newValues)
  }

  const personLabel = direction === 'receive' ? lstrings.transaction_details_sender : lstrings.transaction_details_recipient
  const personName = localMetadata.name ?? personLabel
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

  const categoriesText = formatCategory(splitCategory(localMetadata.category ?? undefined))

  const accentColors: AccentColors = {
    // Transparent fallback for while iconColor is loading
    iconAccentColor: iconColor ?? '#00000000'
  }

  const backgroundColors = [...theme.assetBackgroundGradientColors]
  if (iconColor != null) {
    const scaledColor = darkenHexColor(iconColor, theme.assetBackgroundColorScale)
    backgroundColors[0] = scaledColor
  }

  const fiatAction = action?.actionType === 'fiat' ? action : undefined

  return (
    <SceneWrapper
      accentColors={accentColors}
      hasNotifications
      hasTabs
      scroll
      padding={theme.rem(0.5)}
      backgroundGradientColors={backgroundColors}
      backgroundGradientEnd={theme.assetBackgroundGradientEnd}
      backgroundGradientStart={theme.assetBackgroundGradientStart}
      overrideDots={theme.backgroundDots.assetOverrideDots}
    >
      <EdgeAnim enter={{ type: 'fadeInUp', distance: 80 }}>
        <CardUi4>
          <RowUi4
            rightButtonType="editable"
            icon={
              thumbnailPath ? (
                <FastImage style={styles.tileThumbnail} source={iconSource} />
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
              <EdgeText>{currentFiatText}</EdgeText>
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
          <RowUi4 rightButtonType="editable" title={lstrings.transaction_details_category_title} onPress={openCategoryInput} body={categoriesText} />
          <RowUi4
            rightButtonType="editable"
            title={lstrings.transaction_details_notes_title}
            body={localMetadata.notes == null || localMetadata.notes.trim() === '' ? lstrings.transaction_details_empty_note_placeholder : localMetadata.notes}
            onPress={openNotesInput}
          />
          {transaction.memos?.map((memo, i) =>
            memo.hidden === true ? null : <RowUi4 body={memo.value} key={`memo${i}`} title={getMemoTitle(memo.memoName)} rightButtonType="copy" />
          )}
        </CardUi4>
      </EdgeAnim>
      {recipientsAddresses === '' ? null : (
        <EdgeAnim enter={{ type: 'fadeInDown', distance: 60 }}>
          <CardUi4>
            <RowUi4 maximumHeight="large" rightButtonType="copy" title={lstrings.transaction_details_recipient_addresses} body={recipientsAddresses} />
          </CardUi4>
        </EdgeAnim>
      )}

      <EdgeAnim enter={{ type: 'fadeInDown', distance: 80 }}>
        {swapData == null ? null : <SwapDetailsCard swapData={swapData} transaction={transaction} wallet={wallet} />}
      </EdgeAnim>
      <EdgeAnim enter={{ type: 'fadeInDown', distance: 80 }}>
        {fiatAction == null || assetAction == null ? null : (
          <FiatExchangeDetailsCard action={fiatAction} assetAction={assetAction} transaction={transaction} wallet={wallet} />
        )}
      </EdgeAnim>
      <EdgeAnim enter={{ type: 'fadeInDown', distance: 100 }}>
        <AdvancedDetailsCard transaction={transaction} url={sprintf(wallet.currencyInfo.transactionExplorer, transaction.txid)} />
      </EdgeAnim>
      <EdgeAnim enter={{ type: 'fadeInDown', distance: 120 }}>
        <ButtonsViewUi4
          layout="column"
          primary={{
            onPress: navigation.pop,
            label: lstrings.string_done_cap
          }}
          parentType="scene"
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
  tileTextPriceChangeUp: {
    color: theme.positiveText
  },
  tileTextPriceChangeDown: {
    color: theme.negativeText
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

const convertActionToSwapData = (account: EdgeAccount, transaction: EdgeTransaction): EdgeTxSwap | undefined => {
  const action = transaction.savedAction ?? transaction.chainAction
  const assetAction = transaction.assetAction ?? transaction.chainAssetAction

  if (action == null || assetAction == null) {
    return
  }

  if (action.actionType !== 'swap') {
    return
  }

  const { swapInfo, orderId, orderUri, isEstimate, toAsset, payoutAddress, payoutWalletId, refundAddress } = action

  const payoutCurrencyCode = getCurrencyCodeWithAccount(account, toAsset.pluginId, toAsset.tokenId)
  if (payoutCurrencyCode == null) return

  const out: EdgeTxSwap = {
    orderId,
    orderUri,
    isEstimate: isEstimate ?? true,
    plugin: swapInfo,
    payoutAddress: payoutAddress,
    payoutCurrencyCode,
    payoutNativeAmount: action.toAsset.nativeAmount ?? '0',
    payoutWalletId: payoutWalletId,
    refundAddress: refundAddress
  }
  return out
}
