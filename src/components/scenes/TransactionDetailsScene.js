// @flow

import { abs, bns, sub } from 'biggystring'
import type { EdgeCurrencyInfo, EdgeDenomination, EdgeMetadata, EdgeTransaction } from 'edge-core-js'
import React, { Component, Fragment } from 'react'
import { Image, TouchableWithoutFeedback, View } from 'react-native'
import slowlog from 'react-native-slowlog'
import { sprintf } from 'sprintf-js'

import * as Constants from '../../constants/indexConstants'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui.js'
import styles, { iconSize, styles as styleRaw } from '../../styles/scenes/TransactionDetailsStyle'
import type { GuiContact, GuiWallet } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import * as UTILS from '../../util/utils'
import { launchModal } from '../common/ModalProvider.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { TransactionDetailsCategoryInput } from '../common/TransactionDetailsCategoryInput'
import { TransactionDetailsFiatInput } from '../common/TransactionDetailsFiatInput'
import { TransactionDetailsNotesInput } from '../common/TransactionDetailsNotesInput'
import { TransactionDetailsPersonInput } from '../common/TransactionDetailsPersonInput'
import { createAdvancedTransactionDetailsModal } from '../modals/AdvancedTransactionDetailsModal.js'
import { Airship } from '../services/AirshipInstance.js'

const categories = {
  exchange: {
    color: styleRaw.typeExchange.color,
    syntax: s.strings.fragment_transaction_exchange,
    key: 'exchange'
  },
  expense: {
    color: styleRaw.typeExpense.color,
    syntax: s.strings.fragment_transaction_expense,
    key: 'expense'
  },
  transfer: {
    color: styleRaw.typeTransfer.color,
    syntax: s.strings.fragment_transaction_transfer,
    key: 'transfer'
  },
  income: {
    color: styleRaw.typeIncome.color,
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
  settings: Object, // TODO: This badly needs to get typed but it is a huge dynamically generated object with embedded maps -paulvp,
  thumbnailPath: string,
  currencyInfo: EdgeCurrencyInfo | null,
  currencyCode: string,
  wallets: { [walletId: string]: GuiWallet },
  currentFiatAmount?: string
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
  subCategory: string,
  walletDefaultDenomProps: EdgeDenomination,
  guiWallet: GuiWallet
}

type TransactionDetailsProps = TransactionDetailsOwnProps & TransactionDetailsDispatchProps

export class TransactionDetails extends Component<TransactionDetailsProps, State> {
  constructor (props: TransactionDetailsProps) {
    super(props)
    const { settings, thumbnailPath, wallets } = props
    const edgeTransaction = {
      ...props.edgeTransaction,
      date: UTILS.autoCorrectDate(props.edgeTransaction.date)
    }
    const direction = parseInt(edgeTransaction.nativeAmount) >= 0 ? 'receive' : 'send'
    const category = this.initializeFormattedCategories(edgeTransaction.metadata, direction)
    const guiWallet = wallets[edgeTransaction.wallet.id]

    this.state = {
      amountFiat: this.initalizeAmountBalance(edgeTransaction.metadata),
      payeeName: edgeTransaction.metadata && edgeTransaction.metadata.name ? edgeTransaction.metadata.name : '', // remove commenting once metaData in Redux
      notes: edgeTransaction.metadata && edgeTransaction.metadata.name ? edgeTransaction.metadata.name : '',
      category: category.category,
      subCategory: category.subCategory,
      thumbnailPath,
      direction,
      guiWallet,
      bizId: 0,
      miscJson: edgeTransaction.metadata ? edgeTransaction.metadata.miscJson : '',
      walletDefaultDenomProps: UTILS.isCryptoParentCurrency(guiWallet, edgeTransaction.currencyCode)
        ? UTILS.getWalletDefaultDenomProps(guiWallet, settings)
        : UTILS.getWalletDefaultDenomProps(guiWallet, settings, edgeTransaction.currencyCode)
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
        const splittedCategory = fullCategory.split('')
        const category = splittedCategory[0]
        return {
          category: categories[category] ? categories[category].key : defaultCategory,
          subCategory: splittedCategory[1]
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
  openPersonInput () {
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
  openFiatInput () {
    Airship.show(bridge => (
      <TransactionDetailsFiatInput
        bridge={bridge}
        currency={this.state.guiWallet.fiatCurrencyCode}
        amount={this.state.amountFiat}
        onChange={this.onChangeFiat}
      />
    )).then(_ => {})
  }

  onChangeCategory = (category: string, subCategory: string) => this.setState({ category, subCategory })
  openCategoryInput () {
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
  openNotesInput () {
    Airship.show(bridge => <TransactionDetailsNotesInput bridge={bridge} notes={this.state.notes} onChange={this.onChangeNotes} />).then(_ => {})
  }

  async openAdvancedDetails () {
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
    const { edgeTransaction } = this.props
    const { walletDefaultDenomProps, guiWallet } = this.state

    const absoluteAmount = abs(edgeTransaction.nativeAmount)
    const convertedAmount = UTILS.convertNativeToDisplay(walletDefaultDenomProps.multiplier)(absoluteAmount)
    const amountString = UTILS.decimalOrZero(UTILS.truncateDecimals(convertedAmount, 6), 6)
    const currencyName = guiWallet.currencyNames[guiWallet.currencyCode]
    const symbolString =
      UTILS.isCryptoParentCurrency(guiWallet, edgeTransaction.currencyCode) && walletDefaultDenomProps.symbol ? walletDefaultDenomProps.symbol : ''

    return {
      amountString,
      symbolString,
      currencyName,
      feeString: ''
    }
  }

  getSentCryptoAmount = () => {
    const { edgeTransaction } = this.props
    const { walletDefaultDenomProps, guiWallet } = this.state

    const absoluteAmount = abs(edgeTransaction.nativeAmount)
    const symbolString =
      UTILS.isCryptoParentCurrency(guiWallet, edgeTransaction.currencyCode) && walletDefaultDenomProps.symbol ? walletDefaultDenomProps.symbol : ''
    const currencyName = guiWallet.currencyNames[guiWallet.currencyCode]

    if (edgeTransaction.networkFee) {
      const convertedAmount = UTILS.convertNativeToDisplay(walletDefaultDenomProps.multiplier)(absoluteAmount)
      const convertedFee = UTILS.convertNativeToDisplay(walletDefaultDenomProps.multiplier)(edgeTransaction.networkFee)
      const amountMinusFee = sub(convertedAmount, convertedFee)
      const amountTruncatedDecimals = UTILS.truncateDecimals(amountMinusFee.toString(), 6)
      const amountString = UTILS.decimalOrZero(amountTruncatedDecimals, 6)

      const feeAbsolute = abs(UTILS.truncateDecimals(convertedFee, 6))
      const feeString = symbolString
        ? sprintf(s.strings.fragment_tx_detail_mining_fee_with_symbol, symbolString, feeAbsolute)
        : sprintf(s.strings.fragment_tx_detail_mining_fee_with_denom, feeAbsolute, walletDefaultDenomProps.name)
      return {
        amountString,
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

    const fiatAmount = amountFiat.replace(',', '.')
    const difference = parseFloat(currentFiatAmount) - parseFloat(fiatAmount)
    const percentageFloat = (difference / parseFloat(fiatAmount)) * 100
    const percentage = bns.toFixed(percentageFloat.toString(), 2, 2)

    return {
      amount: currentFiatAmount || '',
      difference,
      percentage: bns.abs(percentage)
    }
  }

  // Render
  render () {
    const { direction, amountFiat, payeeName, thumbnailPath, notes, category, subCategory, guiWallet } = this.state
    const { fiatCurrencyCode } = guiWallet

    const crypto: fiatCryptoAmountUI = direction === 'receive' ? this.getReceivedCryptoAmount() : this.getSentCryptoAmount()
    const fiatSymbol = UTILS.getFiatSymbol(guiWallet.fiatCurrencyCode)
    const fiatValue = UTILS.truncateDecimals(amountFiat.replace('-', ''), 2, true)
    const currentFiat: fiatCurrentAmountUI = this.getCurrentFiat()
    const personLabel = direction === 'receive' ? s.strings.transaction_details_sender : s.strings.transaction_details_recepient
    const personName = payeeName && payeeName !== '' ? this.state.payeeName : personLabel
    const personHeader = sprintf(s.strings.transaction_details_person_name, personLabel)

    return (
      <Fragment>
        <SceneWrapper bodySplit={scale(24)}>
          <View style={styles.container}>
            <View style={styles.tilesContainer}>
              <TouchableWithoutFeedback onPress={this.openPersonInput}>
                <View style={styles.tileContainerBig}>
                  <Icon type={Constants.ION_ICONS} name={Constants.CREATE_OUTLINE} size={16} style={styles.tileIcon} />
                  <FormattedText style={styles.tileTextTop}>{personHeader}</FormattedText>
                  <View style={styles.tileRow}>
                    {thumbnailPath ? (
                      <Image style={[styles.tileThumbnail]} source={{ uri: thumbnailPath }} />
                    ) : (
                      <Icon type={Constants.ION_ICONS} name={Constants.CONTACT} size={iconSize.avatar} style={styles.tileAvatarIcon} />
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
                  {` (${crypto.feeString})`}
                </FormattedText>
              </View>
              <TouchableWithoutFeedback onPress={this.openFiatInput}>
                <View style={styles.tileContainer}>
                  <Icon type={Constants.ION_ICONS} name={Constants.CREATE_OUTLINE} size={16} style={styles.tileIcon} />
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
                  <FormattedText style={styles.tileTextPrice}>
                    {`${fiatSymbol} `}
                    {currentFiat.amount}
                  </FormattedText>
                  <FormattedText style={currentFiat.difference >= 0 ? styles.tileTextPriceChangeUp : styles.tileTextPriceChangeDown}>
                    {currentFiat.difference >= 0 ? currentFiat.percentage : `- ${currentFiat.percentage}`}%
                  </FormattedText>
                </View>
              </View>
              <TouchableWithoutFeedback onPress={this.openCategoryInput}>
                <View style={styles.tileContainerBig}>
                  <Icon type={Constants.ION_ICONS} name={Constants.CREATE_OUTLINE} size={16} style={styles.tileIcon} />
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
                <View style={styles.tileContainerBig}>
                  <Icon type={Constants.ION_ICONS} name={Constants.CREATE_OUTLINE} size={16} style={styles.tileIcon} />
                  <FormattedText style={styles.tileTextTop}>{s.strings.transaction_details_notes_title}</FormattedText>
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
          </View>
        </SceneWrapper>
      </Fragment>
    )
  }
}
