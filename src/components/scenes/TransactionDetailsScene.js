// @flow

import { abs, bns, sub } from 'biggystring'
import type { EdgeCurrencyInfo, EdgeDenomination, EdgeMetadata, EdgeTransaction } from 'edge-core-js'
import React, { Component, Fragment } from 'react'
import { Image, ScrollView, TouchableWithoutFeedback, View } from 'react-native'
import slowlog from 'react-native-slowlog'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import editIcon from '../../assets/images/transaction_details_icon.png'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index.js'
import FormattedText from '../../modules/UI/components/FormattedText/index.js'
import styles, { iconSize } from '../../styles/scenes/TransactionDetailsStyle.js'
import type { GuiContact, GuiWallet } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import * as UTILS from '../../util/utils.js'
import { launchModal } from '../common/ModalProvider.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { createAdvancedTransactionDetailsModal } from '../modals/AdvancedTransactionDetailsModal.js'
import { TransactionDetailsCategoryInput } from '../modals/TransactionDetailsCategoryInput.js'
import { TransactionDetailsFiatInput } from '../modals/TransactionDetailsFiatInput.js'
import { TransactionDetailsNotesInput } from '../modals/TransactionDetailsNotesInput.js'
import { TransactionDetailsPersonInput } from '../modals/TransactionDetailsPersonInput.js'
import { Airship } from '../services/AirshipInstance.js'

const categories = {
  exchange: {
    syntax: s.strings.fragment_transaction_exchange,
    key: 'exchange'
  },
  expense: {
    syntax: s.strings.fragment_transaction_expense,
    key: 'expense'
  },
  transfer: {
    syntax: s.strings.fragment_transaction_transfer,
    key: 'transfer'
  },
  income: {
    syntax: s.strings.fragment_transaction_income,
    key: 'income'
  }
}

type fiatCryptoAmountUI = {
  amountString: string,
  symbolString: string,
  currencyName: string,
  feeString: string
}

type fiatCurrentAmountUI = {
  amount: string,
  difference: number,
  percentage: string
}

export type TransactionDetailsOwnProps = {
  edgeTransaction: EdgeTransaction,
  contacts: Array<GuiContact>,
  subcategoriesList: Array<string>,
  thumbnailPath: string,
  currencyInfo: EdgeCurrencyInfo | null,
  currencyCode: string,
  guiWallet: GuiWallet,
  currentFiatAmount: string,
  walletDefaultDenomProps: EdgeDenomination
}

export type TransactionDetailsDispatchProps = {
  setNewSubcategory: (string, Array<string>) => void,
  setTransactionDetails: (transaction: EdgeTransaction, edgeMetadata: EdgeMetadata) => void,
  getSubcategories: () => void
}

type State = {
  payeeName: string, // remove commenting once metaData in Redux
  thumbnailPath: string,
  notes: string,
  amountFiat: string,
  direction: string,
  bizId: number,
  miscJson: any, // core receives this as a string
  category: string,
  subCategory: string
}

type TransactionDetailsProps = TransactionDetailsOwnProps & TransactionDetailsDispatchProps

export class TransactionDetails extends Component<TransactionDetailsProps, State> {
  constructor (props: TransactionDetailsProps) {
    super(props)
    const { thumbnailPath } = props
    const edgeTransaction = {
      ...props.edgeTransaction,
      date: UTILS.autoCorrectDate(props.edgeTransaction.date)
    }
    const direction = parseInt(edgeTransaction.nativeAmount) >= 0 ? 'receive' : 'send'
    const category = this.initializeFormattedCategories(edgeTransaction.metadata, direction)

    this.state = {
      amountFiat: this.initalizeAmountBalance(edgeTransaction.metadata),
      payeeName: edgeTransaction.metadata && edgeTransaction.metadata.name ? edgeTransaction.metadata.name : '', // remove commenting once metaData in Redux
      notes: edgeTransaction.metadata && edgeTransaction.metadata.notes ? edgeTransaction.metadata.notes : '',
      category: category.category,
      subCategory: category.subCategory,
      thumbnailPath,
      direction,
      bizId: 0,
      miscJson: edgeTransaction.metadata ? edgeTransaction.metadata.miscJson : ''
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  initalizeAmountBalance = (metadata: ?EdgeMetadata) => {
    if (metadata && metadata.amountFiat) {
      const initialAmount = metadata.amountFiat.toFixed(2)
      const absoluteAmount = bns.abs(initialAmount)
      return intl.formatNumber(bns.toFixed(absoluteAmount, 2, 2), { noGrouping: true })
    }
    return intl.formatNumber('0.00')
  }

  initializeFormattedCategories = (metadata: ?EdgeMetadata, direction: string) => {
    const defaultCategory = direction === 'receive' ? categories.income.key : categories.expense.key
    if (metadata) {
      const fullCategory = metadata.category || ''
      const colonOccurrence = fullCategory.indexOf(':')
      if (fullCategory && colonOccurrence) {
        const splittedFullCategory = UTILS.splitTransactionCategory(fullCategory)
        const { subCategory } = splittedFullCategory
        const category = splittedFullCategory.category.toLowerCase()
        return {
          category: categories[category] ? categories[category].key : defaultCategory,
          subCategory
        }
      }
    }
    return { category: defaultCategory, subCategory: '' }
  }

  componentDidMount () {
    this.props.getSubcategories()
  }

  // Inputs Components
  onChangePayee = (payeeName: string, thumbnailPath: string) => {
    this.setState({ payeeName, thumbnailPath })
  }
  openPersonInput = () => {
    const personLabel = this.state.direction === 'receive' ? s.strings.transaction_details_payer : s.strings.transaction_details_payee
    Airship.show(bridge => (
      <TransactionDetailsPersonInput
        bridge={bridge}
        personStatus={personLabel}
        personName={this.state.payeeName}
        onChangePerson={this.onChangePayee}
        contacts={this.props.contacts}
      />
    )).then(_ => {})
  }

  onChangeFiat = (amountFiat: string) => this.setState({ amountFiat })
  openFiatInput = () => {
    Airship.show(bridge => (
      <TransactionDetailsFiatInput
        bridge={bridge}
        currency={this.props.guiWallet.fiatCurrencyCode}
        amount={this.state.amountFiat}
        onChange={this.onChangeFiat}
      />
    )).then(_ => {})
  }

  onChangeCategory = (category: string, subCategory: string) => this.setState({ category, subCategory })
  openCategoryInput = () => {
    Airship.show(bridge => (
      <TransactionDetailsCategoryInput
        bridge={bridge}
        categories={categories}
        subCategories={this.props.subcategoriesList}
        category={this.state.category}
        subCategory={this.state.subCategory}
        setNewSubcategory={this.props.setNewSubcategory}
        onChange={this.onChangeCategory}
      />
    )).then(_ => {})
  }

  onChangeNotes = (notes: string) => this.setState({ notes })
  openNotesInput = () => {
    Airship.show(bridge => (
      <TransactionDetailsNotesInput
        bridge={bridge}
        title={s.strings.transaction_details_notes_title}
        placeholder={s.strings.transaction_details_notes_title}
        notes={this.state.notes}
        onChange={this.onChangeNotes}
      />
    )).then(_ => {})
  }

  openAdvancedDetails = async () => {
    const { edgeTransaction, currencyInfo } = this.props
    await launchModal(
      createAdvancedTransactionDetailsModal({
        txExplorerUrl: currencyInfo ? sprintf(currencyInfo.transactionExplorer, edgeTransaction.txid) : null,
        ...edgeTransaction
      })
    )
  }

  onSaveTxDetails = () => {
    const { payeeName, notes, bizId, miscJson, category, subCategory, amountFiat } = this.state
    const { edgeTransaction } = this.props
    let finalAmountFiat
    const fullCategory = category ? `${UTILS.capitalize(category)}:${subCategory}` : undefined
    const decimalAmountFiat = Number.parseFloat(amountFiat.replace(',', '.'))
    if (isNaN(decimalAmountFiat)) {
      // if invalid number set to previous saved amountFiat
      finalAmountFiat = edgeTransaction.metadata ? edgeTransaction.metadata.amountFiat : 0.0
    } else {
      // if a valid number or empty string then set to zero (empty) or actual number
      finalAmountFiat = !amountFiat ? 0.0 : decimalAmountFiat
    }
    edgeTransaction.metadata = { name: payeeName, category: fullCategory, notes, amountFiat: finalAmountFiat, bizId, miscJson }
    this.props.setTransactionDetails(edgeTransaction, edgeTransaction.metadata)
  }

  // Crypto Amount Logic
  getReceivedCryptoAmount = () => {
    const { edgeTransaction, walletDefaultDenomProps, guiWallet } = this.props

    const absoluteAmount = abs(edgeTransaction.nativeAmount)
    const convertedAmount = UTILS.convertNativeToDisplay(walletDefaultDenomProps.multiplier)(absoluteAmount)
    const currencyName = guiWallet.currencyNames[edgeTransaction.currencyCode]
    const symbolString =
      UTILS.isCryptoParentCurrency(guiWallet, edgeTransaction.currencyCode) && walletDefaultDenomProps.symbol ? walletDefaultDenomProps.symbol : ''

    return {
      amountString: convertedAmount,
      symbolString,
      currencyName,
      feeString: ''
    }
  }

  getSentCryptoAmount = () => {
    const { edgeTransaction, walletDefaultDenomProps, guiWallet } = this.props

    const absoluteAmount = abs(edgeTransaction.nativeAmount)
    const symbolString =
      UTILS.isCryptoParentCurrency(guiWallet, edgeTransaction.currencyCode) && walletDefaultDenomProps.symbol ? walletDefaultDenomProps.symbol : ''
    const currencyName = guiWallet.currencyNames[edgeTransaction.currencyCode]

    if (edgeTransaction.networkFee) {
      const convertedAmount = UTILS.convertNativeToDisplay(walletDefaultDenomProps.multiplier)(absoluteAmount)
      const convertedFee = UTILS.convertNativeToDisplay(walletDefaultDenomProps.multiplier)(edgeTransaction.networkFee)
      const amountMinusFee = sub(convertedAmount, convertedFee)

      const feeAbsolute = abs(UTILS.truncateDecimals(convertedFee, 6))
      const feeString = symbolString
        ? sprintf(s.strings.fragment_tx_detail_mining_fee_with_symbol, feeAbsolute)
        : sprintf(s.strings.fragment_tx_detail_mining_fee_with_denom, feeAbsolute, walletDefaultDenomProps.name)
      return {
        amountString: amountMinusFee,
        symbolString,
        currencyName,
        feeString
      }
    } else {
      return {
        amountString: absoluteAmount,
        symbolString,
        currencyName,
        feeString: ''
      }
    }
  }

  // Exchange Rate Fiat
  getCurrentFiat = () => {
    const { currentFiatAmount } = this.props
    const { amountFiat } = this.state

    const amount = currentFiatAmount
      ? parseFloat(currentFiatAmount)
        .toFixed(2)
        .toString()
      : '0'
    const fiatAmount = amountFiat.replace(',', '.')
    const difference = amount ? parseFloat(amount) - parseFloat(fiatAmount) : 0
    const percentageFloat = amount && parseFloat(fiatAmount) > 0 ? (difference / parseFloat(fiatAmount)) * 100 : 0
    const percentage = bns.toFixed(percentageFloat.toString(), 2, 2)

    return {
      amount,
      difference,
      percentage: bns.abs(percentage)
    }
  }

  // Render
  render () {
    const { guiWallet } = this.props
    const { direction, amountFiat, payeeName, thumbnailPath, notes, category, subCategory } = this.state
    const { fiatCurrencyCode } = guiWallet

    const crypto: fiatCryptoAmountUI = direction === 'receive' ? this.getReceivedCryptoAmount() : this.getSentCryptoAmount()
    const fiatSymbol = UTILS.getFiatSymbol(guiWallet.fiatCurrencyCode)
    const fiatValue = UTILS.truncateDecimals(amountFiat.replace('-', ''), 2, true)
    const currentFiat: fiatCurrentAmountUI = this.getCurrentFiat()
    const personLabel = direction === 'receive' ? s.strings.transaction_details_sender : s.strings.transaction_details_recipient
    const personName = payeeName && payeeName !== '' ? this.state.payeeName : personLabel
    const personHeader = sprintf(s.strings.transaction_details_person_name, personLabel)

    return (
      <Fragment>
        <SceneWrapper bodySplit={scale(24)}>
          <View style={styles.container}>
            <ScrollView>
              <View style={styles.tilesContainer}>
                <TouchableWithoutFeedback onPress={this.openPersonInput}>
                  <View style={styles.tileContainerBig}>
                    <Image style={[styles.tileIcon]} source={editIcon} />
                    <FormattedText style={styles.tileTextTop}>{personHeader}</FormattedText>
                    <View style={styles.tileRow}>
                      {thumbnailPath ? (
                        <Image style={[styles.tileThumbnail]} source={{ uri: thumbnailPath }} />
                      ) : (
                        <IonIcon style={styles.tileAvatarIcon} name={'ios-contact'} size={iconSize.avatar} />
                      )}
                      <FormattedText style={styles.tileTextBottom}>{personName}</FormattedText>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
                <View style={styles.tileContainer}>
                  <FormattedText style={styles.tileTextTop}>{sprintf(s.strings.transaction_details_crypto_amount, crypto.currencyName)}</FormattedText>
                  <FormattedText style={styles.tileTextBottom}>
                    {`${crypto.symbolString} `}
                    {crypto.amountString}
                    {crypto.feeString ? ` (${crypto.feeString})` : ''}
                  </FormattedText>
                </View>
                <TouchableWithoutFeedback onPress={this.openFiatInput}>
                  <View style={styles.tileContainer}>
                    <Image style={[styles.tileIcon]} source={editIcon} />
                    <FormattedText style={styles.tileTextTop}>{sprintf(s.strings.transaction_details_amount_in_fiat, fiatCurrencyCode)}</FormattedText>
                    <View style={styles.tileRow}>
                      <FormattedText style={styles.tileTextBottom}>{`${fiatSymbol} `}</FormattedText>
                      <FormattedText style={styles.tileTextBottom}>{fiatValue}</FormattedText>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
                <View style={styles.tileContainer}>
                  <FormattedText style={styles.tileTextTop}>{s.strings.transaction_details_amount_current_price}</FormattedText>
                  <View style={styles.tileRow}>
                    <FormattedText style={styles.tileTextBottom}>{`${fiatSymbol} `}</FormattedText>
                    <FormattedText style={styles.tileTextPrice}>{currentFiat.amount}</FormattedText>
                    <FormattedText style={parseFloat(currentFiat.difference) >= 0 ? styles.tileTextPriceChangeUp : styles.tileTextPriceChangeDown}>
                      {parseFloat(currentFiat.difference) >= 0 ? currentFiat.percentage : `- ${currentFiat.percentage}`}%
                    </FormattedText>
                  </View>
                </View>
                <TouchableWithoutFeedback onPress={this.openCategoryInput}>
                  <View style={styles.tileContainerBig}>
                    <Image style={[styles.tileIcon]} source={editIcon} />
                    <FormattedText style={styles.tileTextTop}>{s.strings.transaction_details_category_title}</FormattedText>
                    <View style={styles.tileRow}>
                      <View style={styles.tileCategory}>
                        <FormattedText style={styles.tileCategoryText}>{categories[category].syntax}</FormattedText>
                      </View>
                      <FormattedText style={styles.tileSubCategoryText}>{subCategory}</FormattedText>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
                <TouchableWithoutFeedback onPress={this.openNotesInput}>
                  <View style={styles.tileContainerNotes}>
                    <Image style={[styles.tileIcon]} source={editIcon} />
                    <FormattedText style={styles.tileTextTopNotes}>{s.strings.transaction_details_notes_title}</FormattedText>
                    <FormattedText style={styles.tileTextNotes}>{notes}</FormattedText>
                  </View>
                </TouchableWithoutFeedback>
                <TouchableWithoutFeedback onPress={this.openAdvancedDetails}>
                  <FormattedText style={styles.textTransactionData}>{s.strings.transaction_details_view_advanced_data}</FormattedText>
                </TouchableWithoutFeedback>
                <View style={styles.spacer} />
                <View style={styles.saveButtonContainer}>
                  <PrimaryButton style={styles.saveButton} onPress={this.onSaveTxDetails}>
                    <PrimaryButton.Text>{s.strings.string_save}</PrimaryButton.Text>
                  </PrimaryButton>
                </View>
              </View>
            </ScrollView>
          </View>
        </SceneWrapper>
      </Fragment>
    )
  }
}
