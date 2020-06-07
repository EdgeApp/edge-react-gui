// @flow

import { abs, bns, sub } from 'biggystring'
import type { EdgeCurrencyInfo, EdgeDenomination, EdgeMetadata, EdgeTransaction } from 'edge-core-js'
import React, { Component } from 'react'
import { Image, Linking, Platform, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import SafariView from 'react-native-safari-view'
import slowlog from 'react-native-slowlog'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import { PrimaryButton2 } from '../../modules/UI/components/Buttons/PrimaryButton2.ui.js'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { type EdgeTheme } from '../../reducers/ThemeReducer.js'
import { iconSize } from '../../styles/scenes/TransactionDetailsStyle.js'
import type { GuiContact, GuiWallet } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import * as UTILS from '../../util/utils.js'
import { launchModal } from '../common/ModalProvider.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { Tile } from '../common/Tile.js'
import { createAdvancedTransactionDetailsModal } from '../modals/AdvancedTransactionDetailsModal.js'
import { TransactionDetailsCategoryInput } from '../modals/TransactionDetailsCategoryInput.js'
import { TransactionDetailsExchangeDetailsModal } from '../modals/TransactionDetailsExchangeDetailsModal.js'
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
  walletDefaultDenomProps: EdgeDenomination,
  theme: EdgeTheme,
  destinationDenomination?: EdgeDenomination,
  destinationWallet?: GuiWallet
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
  styles: StyleSheet
}

type TransactionDetailsProps = TransactionDetailsOwnProps & TransactionDetailsDispatchProps

export class TransactionDetails extends Component<TransactionDetailsProps, State> {
  constructor(props: TransactionDetailsProps) {
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
      miscJson: edgeTransaction.metadata ? edgeTransaction.metadata.miscJson : '',
      styles: getStyles(props.theme)
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

  static getDerivedStateFromProps(props: TransactionDetailsProps) {
    return { styles: getStyles(props.theme) }
  }

  componentDidMount() {
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

  renderExchangeData = () => {
    const { destinationDenomination, destinationWallet, edgeTransaction, walletDefaultDenomProps, theme } = this.props
    const { styles } = this.state
    const { swapData, spendTargets } = edgeTransaction

    if (!swapData || !spendTargets || !destinationDenomination) return null

    const sourceAmount = UTILS.convertNativeToDisplay(walletDefaultDenomProps.multiplier)(spendTargets[0].nativeAmount)
    const sourceCurrencyCode = spendTargets[0].currencyCode
    const destinationAmount = UTILS.convertNativeToDisplay(destinationDenomination.multiplier)(swapData.payoutNativeAmount)
    const destinationCurrencyCode = swapData.payoutCurrencyCode

    const openExchangeDetails = () => {
      Airship.show(bridge => (
        <TransactionDetailsExchangeDetailsModal
          bridge={bridge}
          edgeTransaction={edgeTransaction}
          walletDenomination={walletDefaultDenomProps}
          destinationDenomination={destinationDenomination}
          destinationWallet={destinationWallet}
          sourceAmount={sourceAmount}
          destinationAmount={destinationAmount}
          theme={theme}
        />
      ))
    }

    const openUrl = () => {
      const url = swapData.orderUri
      if (!url) return
      if (Platform.OS === 'ios') {
        return SafariView.isAvailable()
          .then(SafariView.show({ url }))
          .catch(error => Linking.openURL(url)) // eslint-disable-line handle-callback-err
      }
      Linking.openURL(url)
    }

    return (
      <>
        <Tile type="touchable" title={s.strings.transaction_details_exchange_details} onPress={openExchangeDetails}>
          <View style={styles.tileColumn}>
            <FormattedText style={styles.tileTextBottom}>{`${s.strings.title_exchange} ${sourceAmount} ${sourceCurrencyCode}`}</FormattedText>
            <FormattedText style={styles.tileTextBottom}>{`${s.strings.string_to_capitalize} ${destinationAmount} ${destinationCurrencyCode}`}</FormattedText>
            <FormattedText style={styles.tileTextBottom}>
              {swapData.isEstimate ? s.strings.transaction_details_exchange_fixed_rate : s.strings.transaction_details_exchange_variable_rate}
            </FormattedText>
          </View>
        </Tile>
        {swapData.orderUri && <Tile type="touchable" title={s.strings.transaction_details_exchange_status_page} onPress={openUrl} body={swapData.orderUri} />}
      </>
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

    const amount = currentFiatAmount ? parseFloat(currentFiatAmount).toFixed(2).toString() : '0'
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
  render() {
    const { guiWallet, edgeTransaction } = this.props
    const { direction, amountFiat, payeeName, thumbnailPath, notes, category, subCategory, styles } = this.state
    const { fiatCurrencyCode } = guiWallet

    const crypto: fiatCryptoAmountUI = direction === 'receive' ? this.getReceivedCryptoAmount() : this.getSentCryptoAmount()
    const fiatSymbol = UTILS.getFiatSymbol(guiWallet.fiatCurrencyCode)
    const fiatValue = UTILS.truncateDecimals(amountFiat.replace('-', ''), 2, true)
    const currentFiat: fiatCurrentAmountUI = this.getCurrentFiat()
    const personLabel = direction === 'receive' ? s.strings.transaction_details_sender : s.strings.transaction_details_recipient
    const personName = payeeName && payeeName !== '' ? this.state.payeeName : personLabel
    const personHeader = sprintf(s.strings.transaction_details_person_name, personLabel)

    return (
      <>
        <SceneWrapper background="header" bodySplit={scale(24)}>
          <ScrollView>
            <View style={styles.tilesContainer}>
              <Tile type="editable" title={personHeader} onPress={this.openPersonInput}>
                <View style={styles.tileRow}>
                  {thumbnailPath ? (
                    <Image style={styles.tileThumbnail} source={{ uri: thumbnailPath }} />
                  ) : (
                    <IonIcon style={styles.tileAvatarIcon} name="ios-contact" size={iconSize.avatar} />
                  )}
                  <FormattedText style={styles.tileTextBottom}>{personName}</FormattedText>
                </View>
              </Tile>
              <Tile
                type="static"
                title={sprintf(s.strings.transaction_details_crypto_amount, crypto.currencyName)}
                body={`${crypto.symbolString} ${crypto.amountString}${crypto.feeString ? ` (${crypto.feeString})` : ''}`}
              />
              <Tile type="editable" title={sprintf(s.strings.transaction_details_amount_in_fiat, fiatCurrencyCode)} onPress={this.openFiatInput}>
                <View style={styles.tileRow}>
                  <FormattedText style={styles.tileTextBottom}>{`${fiatSymbol} `}</FormattedText>
                  <FormattedText style={styles.tileTextBottom}>{fiatValue}</FormattedText>
                </View>
              </Tile>
              <Tile type="static" title={s.strings.transaction_details_amount_current_price}>
                <View style={styles.tileRow}>
                  <FormattedText style={styles.tileTextBottom}>{`${fiatSymbol} `}</FormattedText>
                  <FormattedText style={styles.tileTextPrice}>{currentFiat.amount}</FormattedText>
                  <FormattedText style={parseFloat(currentFiat.difference) >= 0 ? styles.tileTextPriceChangeUp : styles.tileTextPriceChangeDown}>
                    {parseFloat(currentFiat.difference) >= 0 ? currentFiat.percentage : `- ${currentFiat.percentage}`}%
                  </FormattedText>
                </View>
              </Tile>
              <Tile type="editable" title={s.strings.transaction_details_category_title} onPress={this.openCategoryInput}>
                <View style={styles.tileRow}>
                  <View style={styles.tileCategory}>
                    <FormattedText style={styles.tileCategoryText}>{categories[category].syntax}</FormattedText>
                  </View>
                  <FormattedText style={styles.tileSubCategoryText}>{subCategory}</FormattedText>
                </View>
              </Tile>
              {edgeTransaction.spendTargets && (
                <Tile type="static" title={s.strings.transaction_details_recipient_address}>
                  <View style={styles.tileColumn}>
                    {edgeTransaction.spendTargets.map(target => (
                      <FormattedText style={styles.tileTextBottom} key={target.publicAddress}>
                        {target.publicAddress}
                      </FormattedText>
                    ))}
                  </View>
                </Tile>
              )}
              {this.renderExchangeData()}
              <Tile type="editable" title={s.strings.transaction_details_notes_title} body={notes} onPress={this.openNotesInput} />
              <TouchableWithoutFeedback onPress={this.openAdvancedDetails}>
                <FormattedText style={styles.textTransactionData}>{s.strings.transaction_details_view_advanced_data}</FormattedText>
              </TouchableWithoutFeedback>
              <View style={styles.spacer} />
              <View style={styles.saveButtonContainer}>
                <PrimaryButton2 style={styles.saveButton} onPress={this.onSaveTxDetails}>
                  <PrimaryButton2.Text>{s.strings.string_save}</PrimaryButton2.Text>
                </PrimaryButton2>
              </View>
            </View>
          </ScrollView>
        </SceneWrapper>
      </>
    )
  }
}

const getStyles = (theme: EdgeTheme) => {
  const { rem } = theme
  return StyleSheet.create({
    tilesContainer: {
      flex: 1,
      width: '100%',
      flexDirection: 'column'
    },
    tileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: rem(0.25)
    },
    tileColumn: {
      flexDirection: 'column',
      justifyContent: 'center',
      margin: rem(0.25)
    },
    tileTextBottom: {
      color: theme.primaryText,
      fontSize: rem(1)
    },
    tileAvatarIcon: {
      color: theme.primaryText,
      marginRight: rem(0.5)
    },
    tileThumbnail: {
      width: rem(2),
      height: rem(2),
      borderRadius: rem(1),
      marginRight: rem(0.5)
    },
    tileTextPrice: {
      flex: 1,
      color: theme.primaryText,
      fontSize: rem(1)
    },
    tileTextPriceChangeUp: {
      color: theme.accentTextPositive,
      fontSize: rem(1)
    },
    tileTextPriceChangeDown: {
      color: theme.accentTextNegative,
      fontSize: rem(1)
    },
    tileCategory: {
      paddingHorizontal: rem(0.5),
      paddingVertical: rem(0.25),
      marginVertical: rem(0.25),
      borderWidth: 1,
      borderColor: theme.selectButtonOutline,
      borderRadius: 3
    },
    tileCategoryText: {
      color: theme.selectButtonText,
      fontSize: rem(1)
    },
    tileSubCategoryText: {
      marginVertical: rem(0.25),
      marginHorizontal: rem(0.75),
      color: theme.primaryText
    },
    textTransactionData: {
      color: theme.selectButtonText,
      marginVertical: rem(1.25),
      fontSize: rem(1),
      width: '100%',
      textAlign: 'center'
    },
    saveButtonContainer: {
      width: '100%',
      paddingBottom: rem(1),
      justifyContent: 'center',
      alignItems: 'center'
    },
    saveButton: {
      width: '80%',
      borderRadius: rem(1.5),
      height: rem(3)
    }
  })
}
