// @flow

import { abs, sub, bns } from 'biggystring'
import dateformat from 'dateformat'
import type { EdgeCurrencyInfo, EdgeDenomination, EdgeMetadata, EdgeTransaction } from 'edge-core-js'
import React, { Component, Fragment } from 'react'
import type { Ref } from 'react'
import { Animated, Easing, Keyboard, ScrollView, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Image } from 'react-native'
import slowlog from 'react-native-slowlog'
import { sprintf } from 'sprintf-js'

import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import { PayeeIcon } from '../../modules/UI/components/PayeeIcon/PayeeIcon.ui.js'
import styles, { styles as styleRaw, iconSize, materialInput } from '../../styles/scenes/TransactionDetailsStyle'
import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'
import { autoCorrectDate, getFiatSymbol, getWalletDefaultDenomProps, inputBottomPadding, isCryptoParentCurrency } from '../../util/utils'
import ContactSearchResults from '../common/ContactSearchResults.js'
import { launchModal } from '../common/ModalProvider.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import AmountArea from '../common/TransactionDetailAmountArea.js'
import SubCategorySelect from '../common/TransactionSubCategorySelect.js'
import { createAdvancedTransactionDetailsModal } from '../modals/AdvancedTransactionDetailsModal.js'
import { showError } from '../services/AirshipInstance.js'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui.js'
import * as Constants from '../../constants/indexConstants'
import * as UTILS from '../../util/utils'
import { type AirshipBridge, AirshipModal } from '../modals/modalParts'
import { Airship } from '../services/AirshipInstance.js'
import { FormField } from '../common/FormField.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import type { GuiContact, GuiWallet } from '../../types/types.js'
import { TransactionDetailsPersonInput } from '../common/TransactionDetailsPersonInput'
import { TransactionDetailsCategoryInput } from '../common/TransactionDetailsCategoryInput'
import { TransactionDetailsFiatInput } from '../common/TransactionDetailsFiatInput'
import { TransactionDetailsNotesInput } from '../common/TransactionDetailsNotesInput'

const EXCHANGE_TEXT = s.strings.fragment_transaction_exchange
const EXPENSE_TEXT = s.strings.fragment_transaction_expense
const TRANSFER_TEXT = s.strings.fragment_transaction_transfer
const INCOME_TEXT = s.strings.fragment_transaction_income

const categories = {
  exchange: {
    color: styleRaw.typeExchange.color,
    syntax: EXCHANGE_TEXT,
    key: 'exchange'
  },
  expense: {
    color: styleRaw.typeExpense.color,
    syntax: EXPENSE_TEXT,
    key: 'expense'
  },
  transfer: {
    color: styleRaw.typeTransfer.color,
    syntax: TRANSFER_TEXT,
    key: 'transfer'
  },
  income: {
    color: styleRaw.typeIncome.color,
    syntax: INCOME_TEXT,
    key: 'income'
  }
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
  // hasThumbnail: boolean,
  notes: string,
  amountFiat: string,
  direction: string,
  bizId: number,
  miscJson: any, // core receives this as a string
  displayDate: string,
  subCategorySelectVisibility: boolean,
  categorySelectVisibility: boolean,
  category: string,
  subCategory: string,
  contactSearchVisibility: boolean,
  payeeOpacity: any, // AnimatedValue
  subcategoryOpacity: any, // AnimatedValue
  payeeZIndex: number,
  subcatZIndex: number,
  walletDefaultDenomProps: EdgeDenomination
}

type TransactionDetailsProps = TransactionDetailsOwnProps & TransactionDetailsDispatchProps

export class TransactionDetails extends Component<TransactionDetailsProps, State> {
  guiWallet: GuiWallet
  fiatSymbol: string

  constructor (props: TransactionDetailsProps) {
    super(props)
    const edgeTransaction = {
      ...props.edgeTransaction,
      date: autoCorrectDate(props.edgeTransaction.date)
    }
    const displayDate = dateformat(edgeTransaction.date * 1000, 'mmm dS, yyyy, h:MM:ss TT')
    let category = ''
    let subCategory = ''
    let fullCategory = ''
    let payeeName = ''
    let amountFiat = intl.formatNumber('0.00')
    let notes = ''
    const direction = parseInt(edgeTransaction.nativeAmount) >= 0 ? 'receive' : 'send'
    if (edgeTransaction.wallet) {
      this.guiWallet = props.wallets[edgeTransaction.wallet.id]
      this.fiatSymbol = getFiatSymbol(this.guiWallet.fiatCurrencyCode)
    } else {
      showError(s.strings.transaction_detail_unable_to_load_transaction)
    }

    if (edgeTransaction && edgeTransaction.metadata) {
      fullCategory = edgeTransaction.metadata.category ? edgeTransaction.metadata.category : ''
      payeeName = edgeTransaction.metadata.name ? edgeTransaction.metadata.name : '' // remove commenting once metaData in Redux
      notes = edgeTransaction.metadata.notes ? edgeTransaction.metadata.notes : ''
      if (edgeTransaction.metadata.amountFiat) {
        const initial = edgeTransaction.metadata.amountFiat.toFixed(2)
        const absoluteAmountFiat = bns.abs(initial)
        amountFiat = intl.formatNumber(bns.toFixed(absoluteAmountFiat, 2, 2), { noGrouping: true })
      }
    }

    // if there is a user-entered category (type:subcategory)
    if (fullCategory) {
      const colonOccurrence = fullCategory.indexOf(':')
      if (fullCategory && colonOccurrence) {
        category = fullCategory.substring(0, colonOccurrence)
        category = category.charAt(0).toLowerCase() + category.slice(1)
        subCategory = fullCategory.substring(colonOccurrence + 1, fullCategory.length)
      }
    }

    // if type is still not defined then figure out if send or receive (expense vs income)
    if (!category || !categories[category]) {
      if (direction === 'receive') {
        category = categories.income.key
      } else {
        category = categories.expense.key
      }
    } else {
      category = categories[category].key
    }

    this.state = {
      payeeName,
      notes,
      thumbnailPath: props.thumbnailPath,
      category: category,
      amountFiat,
      bizId: 0,
      direction,
      miscJson: edgeTransaction.metadata ? edgeTransaction.metadata.miscJson : '',
      displayDate,
      subCategorySelectVisibility: false,
      categorySelectVisibility: false,
      subCategory: subCategory || '',
      contactSearchVisibility: false,
      payeeOpacity: new Animated.Value(0),
      subcategoryOpacity: new Animated.Value(0),
      payeeZIndex: 0,
      subcatZIndex: 0,
      walletDefaultDenomProps: {
        name: '',
        multiplier: '',
        symbol: ''
      },
      isAdvancedTransactionDetailsModalVisible: false
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  onFocusPayee = () => {
    this.enablePayeeVisibility()
  }

  onBlurPayee = () => {
    this.disablePayeeVisibility()
    Keyboard.dismiss()
  }

  enablePayeeVisibility = () => {
    const toOpacity = 1
    this.setState({ contactSearchVisibility: true, payeeZIndex: 99999 }, () => {
      Animated.timing(this.state.payeeOpacity, {
        toValue: toOpacity,
        easing: Easing.ease,
        duration: 200,
        delay: 0,
        useNativeDriver: true
      }).start()
    })
  }

  disablePayeeVisibility = () => {
    this.state.payeeOpacity.setValue(0)
    this.setState({
      contactSearchVisibility: false,
      payeeZIndex: 0
    })
  }

  onSelectPayee = (payeeName: string, thumbnail: string) => {
    this.onChangePayee(payeeName, thumbnail)
    this.onBlurPayee()
  }


  onChangeCategory = (input: string) => {
    this.setState({
      category: input
    })
  }

  onChangeSubcategory = (input: string) => {
    this.setState({
      subCategory: input
    })
  }


  onNotesKeyboardReturn = () => {
    this.onBlurNotes()
  }

  onEnterCategories = () => {
    this.setState({ categorySelectVisibility: true })
  }

  onExitCategories = () => {
    this.setState({ categorySelectVisibility: false })
  }

  onEnterSubcategories = () => {
    this.refs._scrollView.scrollTo({ x: 0, y: 260, animated: true })
    this.enableSubcategoryVisibility()
  }

  onExitSubcategories = () => {
    // this.disableSubcategoryVisibility()
  }

  enableSubcategoryVisibility = () => {
    const toOpacity = 1
    this.setState({ subCategorySelectVisibility: true, subcatZIndex: 99999 }, () => {
      Animated.timing(this.state.subcategoryOpacity, {
        toValue: toOpacity,
        easing: Easing.ease,
        duration: 200,
        delay: 100,
        useNativeDriver: true
      }).start()
    })
  }

  disableSubcategoryVisibility = () => {
    this.state.subcategoryOpacity.setValue(0)
    this.setState({
      subCategorySelectVisibility: false,
      subcatZIndex: 0
    })
  }

  onSubcategoriesKeyboardReturn = () => {
    this.disableSubcategoryVisibility()
    this.refs._scrollView.scrollTo({ x: 0, y: 0, animated: true })
  }

  onSelectSubCategory = (input: string) => {
    let stringArray
    // check if there is a colon that delineates category and subcategory
    if (!input) {
      this.setState({
        subCategory: ''
      })
    } else {
      // if input *does* exist
      const colonOccurrence = input.indexOf(':')
      if (colonOccurrence) {
        // if it *does* have a colon in it
        stringArray = [input.substring(0, colonOccurrence), input.substring(colonOccurrence + 1, input.length)]
        // console.log('stringArray is: ', stringArray)
        if (Object.keys(categories).indexOf(stringArray[0].toLowerCase()) >= 0) {
          // if the type is of the 4 options
          this.setState({
            category: stringArray[0].toLowerCase(),
            subCategory: stringArray[1]
          })

          if (this.props.subcategoriesList.indexOf(input) === -1) {
            // if this is a new subcategory
            this.addNewSubcategory(input)
          }
        } else {
          this.setState({
            subCategory: stringArray[1]
          })
        }
      } else {
        this.setState({
          subCategory: ''
        })
      }
    }
    this.disableSubcategoryVisibility()
    Keyboard.dismiss()
    this.refs._scrollView.scrollTo({ x: 0, y: 0, animated: true })
  }

  addNewSubcategory = (newSubcategory: string) => {
    this.props.setNewSubcategory(newSubcategory, this.props.subcategoriesList)
  }

  onFocusFiatAmount = () => {
    const { amountFiat } = this.state
    if (amountFiat === '0.00' || amountFiat === '0,00') {
      this.setState({
        amountFiat: ''
      })
    }
  }

  onPressAdvancedDetailsButton = async () => {
    const { edgeTransaction } = this.props
    let txExplorerLink = null
    if (this.props.currencyInfo) {
      txExplorerLink = sprintf(this.props.currencyInfo.transactionExplorer, this.props.edgeTransaction.txid)
    }

    const modal = createAdvancedTransactionDetailsModal({
      txExplorerUrl: txExplorerLink,
      ...edgeTransaction
    })
    await launchModal(modal)
  }

  onSaveTxDetails = () => {
    const { payeeName, notes, bizId, miscJson, category, subCategory, amountFiat } = this.state
    const { edgeTransaction } = this.props
    let fullCategory, finalAmountFiat
    if (category) {
      fullCategory = category.charAt(0).toUpperCase() + category.slice(1) + ':' + subCategory
    } else {
      fullCategory = undefined
    }
    const decimalAmountFiat = Number.parseFloat(amountFiat.replace(',', '.'))
    if (isNaN(decimalAmountFiat)) {
      // if invalid number set to previous saved amountFiat
      finalAmountFiat = edgeTransaction.metadata ? edgeTransaction.metadata.amountFiat : 0.0
    } else {
      // if a valid number or empty string then set to zero (empty) or actual number
      finalAmountFiat = !amountFiat ? 0.0 : decimalAmountFiat
    }
    const edgeMetadata: EdgeMetadata = { name: payeeName, category: fullCategory, notes, amountFiat: finalAmountFiat, bizId, miscJson }
    edgeTransaction.metadata = edgeMetadata
    this.props.setTransactionDetails(edgeTransaction, edgeMetadata)
  }

  componentDidMount () {
    this.props.getSubcategories()
  }

  UNSAFE_componentWillMount () {
    // check if metaToken, is not then do not set walletDefaultProps to anything other than initial blank values
    if (isCryptoParentCurrency(this.guiWallet, this.props.edgeTransaction.currencyCode)) {
      this.setState({ walletDefaultDenomProps: getWalletDefaultDenomProps(this.guiWallet, this.props.settings) })
    } else {
      this.setState({ walletDefaultDenomProps: getWalletDefaultDenomProps(this.guiWallet, this.props.settings, this.props.edgeTransaction.currencyCode) })
    }
  }

  renderPayeeSearch () {
    return (
      <SceneWrapper avoidKeyboard background="none">
        {gap => (
          <Animated.View id="payeeSearchResults" style={[styles.searchPopup, { bottom: -gap.bottom, opacity: this.state.payeeOpacity }]}>
            <View style={styles.payeeNameArea}>
              <View style={styles.payeeNameWrap}>
                <TextInput
                  underlineColorAndroid={'transparent'}
                  autoFocus
                  blurOnSubmit
                  onSubmitEditing={this.onBlurPayee}
                  autoCapitalize="words"
                  autoCorrect={false}
                  onChangeText={this.onChangePayee}
                  style={[styles.payeeNameInput, inputBottomPadding()]}
                  placeholder="Payee"
                  defaultValue={this.state.payeeName}
                  placeholderTextColor={THEME.COLORS.GRAY_2}
                  returnKeyType={'done'}
                />
              </View>
            </View>
            <ContactSearchResults
              bottomGap={gap.bottom}
              onChangePayee={this.onSelectPayee}
              contacts={this.props.contacts}
              currentPayeeText={this.state.payeeName || ''}
              onSelectPayee={this.onSelectPayee}
              blurOnSubmit
              onBlur={this.onBlurPayee}
            />
          </Animated.View>
        )}
      </SceneWrapper>
    )
  }

  renderCategorySearch () {
    const sortedSubcategories = this.props.subcategoriesList.length > 0 ? this.props.subcategoriesList.sort() : []
    const categoryColor = categories[this.state.category].color

    return (
      <SceneWrapper avoidKeyboard background="none">
        {gap => (
          <Animated.View id="subcategorySearchResults" style={[styles.searchPopup, { bottom: -gap.bottom, opacity: this.state.subcategoryOpacity }]}>
            <View style={styles.modalCategoryRow}>
              <TouchableOpacity style={[styles.categoryLeft, { borderColor: categoryColor }]} disabled>
                <FormattedText style={[{ color: categoryColor }, styles.categoryLeftText]}>{categories[this.state.category].syntax}</FormattedText>
              </TouchableOpacity>
              <View style={styles.modalCategoryInputArea}>
                <TextInput
                  underlineColorAndroid={'transparent'}
                  autoFocus
                  blurOnSubmit
                  autoCapitalize="words"
                  onBlur={this.onExitSubcategories}
                  onChangeText={this.onChangeSubcategory}
                  style={[styles.categoryInput, inputBottomPadding()]}
                  defaultValue={this.state.subCategory || ''}
                  placeholder={s.strings.transaction_details_category_title}
                  autoCorrect={false}
                  onSubmitEditing={this.onSubcategoriesKeyboardReturn}
                  placeholderTextColor={THEME.COLORS.GRAY_2}
                  initialNumToRender={8}
                  returnKeyType={'done'}
                />
              </View>
            </View>
            <SubCategorySelect
              bottomGap={gap.bottom}
              onPressFxn={this.onSelectSubCategory}
              enteredSubcategory={this.state.subCategory}
              subcategoriesList={sortedSubcategories}
            />
          </Animated.View>
        )}
      </SceneWrapper>
    )
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

  onChangeFiat = (amountFiat: string) =>  this.setState({ amountFiat })
  openFiatInput () {
    Airship.show(bridge => (
      <TransactionDetailsFiatInput
        bridge={bridge}
        currency={this.guiWallet.fiatCurrencyCode}
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
    Airship.show(bridge => (
      <TransactionDetailsNotesInput
        bridge={bridge}
        notes={this.state.notes}
        onChange={this.onChangeNotes}
      />
    )).then(_ => {})
  }

  // Crypto Amount Logic
  getReceivedCryptoAmount = () => {
    const { guiWallet } = this
    const { edgeTransaction } = this.props
    const { walletDefaultDenomProps } = this.state

    const absoluteAmount = abs(edgeTransaction.nativeAmount)
    const convertedAmount = UTILS.convertNativeToDisplay(walletDefaultDenomProps.multiplier)(absoluteAmount)
    const amountString = UTILS.decimalOrZero(UTILS.truncateDecimals(convertedAmount, 6), 6)
    const currencyName = guiWallet.currencyNames[guiWallet.currencyCode]
    const symbolString = isCryptoParentCurrency(guiWallet, edgeTransaction.currencyCode)
      && walletDefaultDenomProps.symbol
      ? walletDefaultDenomProps.symbol
      : ''

    return {
      amountString,
      symbolString,
      currencyName,
      feeString: null
    }
  }

  getSentCryptoAmount = () => {
    const { guiWallet } = this
    const { edgeTransaction } = this.props
    const { walletDefaultDenomProps } = this.state

    const absoluteAmount = abs(edgeTransaction.nativeAmount)
    const symbolString = isCryptoParentCurrency(guiWallet, edgeTransaction.currencyCode)
      && walletDefaultDenomProps.symbol
      ? walletDefaultDenomProps.symbol
      : ''
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
        feeString: null
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
      amount: currentFiatAmount,
      difference,
      percentage: bns.abs(percentage)
    }
  }

  // Render
  render () {
    const { guiWallet, fiatSymbol } = this
    const { fiatCurrencyCode } = guiWallet
    const { direction, amountFiat, payeeName, thumbnailPath, notes, category, subCategory } = this.state
    const { currentFiatAmount } = this.props

    const crypto = direction === 'receive' ? this.getReceivedCryptoAmount() : this.getSentCryptoAmount()
    const fiatValue = UTILS.truncateDecimals(amountFiat.replace('-', ''), 2, true)
    const currentFiat = this.getCurrentFiat()

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
                  <Icon type={Constants.ION_ICONS} name={Constants.CREATE_OUTLINE} size={16} style={styles.tileIcon}/>
                  <FormattedText style={styles.tileTextTop}>{personHeader}</FormattedText>
                  <View style={styles.tileRow}>
                    {thumbnailPath ? (
                      <Image style={[styles.tileThumbnail]} source={{ uri: thumbnailPath }} />
                    ) : (
                      <Icon type={Constants.ION_ICONS} name={Constants.CONTACT} size={iconSize.avatar} style={styles.tileAvatarIcon}/>
                    )}
                    <FormattedText style={styles.tileTextBottom}>{personName}</FormattedText>
                  </View>
                </View>
              </TouchableWithoutFeedback>
              <View style={styles.tileContainer}>
                <FormattedText style={styles.tileTextTop}>
                  {sprintf(s.strings.transaction_details_crypto_amount, crypto.currencyName)}
                </FormattedText>
                <FormattedText style={styles.tileTextBottom}>
                  {`${crypto.symbolString} `}{crypto.amountString}
                  {crypto.feeString ? ` (${crypto.feeString})` : null}
                </FormattedText>
              </View>
              <TouchableWithoutFeedback onPress={this.openFiatInput}>
                <View style={styles.tileContainer}>
                  <Icon type={Constants.ION_ICONS} name={Constants.CREATE_OUTLINE} size={16} style={styles.tileIcon}/>
                  <FormattedText style={styles.tileTextTop}>
                    {sprintf(s.strings.transaction_details_amount_in_fiat, fiatCurrencyCode)}
                  </FormattedText>
                  <View style={styles.tileRow}>
                    <FormattedText style={styles.tileTextBottom}>{`${fiatSymbol} `}</FormattedText>
                    <FormattedText style={styles.tileTextBottom}>{fiatValue}</FormattedText>
                  </View>
                </View>
              </TouchableWithoutFeedback>
              <View style={styles.tileContainer}>
                <FormattedText style={styles.tileTextTop}>
                  {s.strings.transaction_details_amount_current_price}
                </FormattedText>
                <View style={styles.tileRow}>
                  <FormattedText style={styles.tileTextPrice}>{`${fiatSymbol} `}{currentFiat.amount}</FormattedText>
                  <FormattedText
                    style={currentFiat.difference >= 0 ? styles.tileTextPriceChangeUp : styles.tileTextPriceChangeDown}
                  >
                    {currentFiat.difference >= 0 ? currentFiat.percentage : `- ${currentFiat.percentage}`}%
                  </FormattedText>
                </View>
              </View>
              <TouchableWithoutFeedback onPress={this.openCategoryInput}>
                <View style={styles.tileContainerBig}>
                  <Icon type={Constants.ION_ICONS} name={Constants.CREATE_OUTLINE} size={16} style={styles.tileIcon}/>
                  <FormattedText style={styles.tileTextTop}>
                    {s.strings.transaction_details_category_title}
                  </FormattedText>
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
                  <Icon type={Constants.ION_ICONS} name={Constants.CREATE_OUTLINE} size={16} style={styles.tileIcon}/>
                  <FormattedText style={styles.tileTextTop}>{s.strings.transaction_details_notes_title}</FormattedText>
                  <FormattedText style={styles.tileTextNotes}>{notes}</FormattedText>
                </View>
              </TouchableWithoutFeedback>
              <FormattedText style={styles.textTransactionData}>View Advance Transaction Data</FormattedText>
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
