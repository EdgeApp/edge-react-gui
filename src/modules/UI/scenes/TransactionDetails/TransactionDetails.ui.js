// @flow

import { bns } from 'biggystring'
import dateformat from 'dateformat'
import type { EdgeCurrencyInfo, EdgeDenomination, EdgeMetadata, EdgeTransaction } from 'edge-core-js'
import React, { Component } from 'react'
import { Animated, Easing, Keyboard, ScrollView, TextInput, TouchableOpacity, View } from 'react-native'
import slowlog from 'react-native-slowlog'
import { sprintf } from 'sprintf-js'

import { scale } from '../../../../lib/scaling.js'
import { intl } from '../../../../locales/intl'
import s from '../../../../locales/strings.js'
import THEME from '../../../../theme/variables/airbitz'
import { PLATFORM } from '../../../../theme/variables/platform.js'
import type { GuiContact, GuiWallet } from '../../../../types.js'
import { autoCorrectDate, getFiatSymbol, getWalletDefaultDenomProps, inputBottomPadding, isCryptoParentCurrency } from '../../../utils'
import FormattedText from '../../components/FormattedText'
import Gradient from '../../components/Gradient/Gradient.ui'
import PayeeIcon from '../../components/PayeeIcon/PayeeIcon.ui.js'
import SafeAreaView from '../../components/SafeAreaView'
import AmountArea from './AmountArea.ui.js'
import { AdvancedTransactionDetailsModal } from './components/AdvancedDetailsModal/AdvancedTransactionDetailsModal.ui.js'
import ContactSearchResults from './ContactSearchResults.ui.js'
import styles, { styles as styleRaw } from './style'
import SubCategorySelect from './SubCategorySelect.ui.js'

const categories = ['income', 'expense', 'exchange', 'transfer']

const EXCHANGE_TEXT = s.strings.fragment_transaction_exchange
const EXPENSE_TEXT = s.strings.fragment_transaction_expense
const TRANSFER_TEXT = s.strings.fragment_transaction_transfer
const INCOME_TEXT = s.strings.fragment_transaction_income

const types = {
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
  wallets: { [walletId: string]: GuiWallet }
}

export type TransactionDetailsDispatchProps = {
  setNewSubcategory: (string, Array<string>) => void,
  openHelpModal: () => void,
  setTransactionDetails: (txid: string, currencyCode: string, edgeMetadata: EdgeMetadata) => void,
  getSubcategories: () => void,
  displayDropdownAlert: (message: string, title: string) => void
}

type State = {
  name: string, // remove commenting once metaData in Redux
  thumbnailPath: string,
  // hasThumbnail: boolean,
  category: string,
  notes: string,
  amountFiat: string,
  direction: string,
  bizId: number,
  miscJson: any, // core receives this as a string
  displayDate: string,
  subCategorySelectVisibility: boolean,
  categorySelectVisibility: boolean,
  subCategory: string,
  contactSearchVisibility: boolean,
  payeeOpacity: any, // AnimatedValue
  subcategoryOpacity: any, // AnimatedValue
  payeeZIndex: number,
  subcatZIndex: number,
  type: string,
  walletDefaultDenomProps: EdgeDenomination,
  isAdvancedTransactionDetailsModalVisible: boolean
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
    let type = ''
    let subCategory = ''
    let cat = ''
    let name = ''
    let amountFiat = intl.formatNumber('0.00')
    let notes = ''
    const direction = parseInt(edgeTransaction.nativeAmount) >= 0 ? 'receive' : 'send'
    if (edgeTransaction.wallet) {
      this.guiWallet = props.wallets[edgeTransaction.wallet.id]
      this.fiatSymbol = getFiatSymbol(this.guiWallet.fiatCurrencyCode)
    } else {
      this.props.displayDropdownAlert(s.strings.transaction_detail_no_wallet, s.strings.transaction_detail_unable_to_load_transaction)
    }

    if (edgeTransaction && edgeTransaction.metadata) {
      cat = edgeTransaction.metadata.category ? edgeTransaction.metadata.category : ''
      name = edgeTransaction.metadata.name ? edgeTransaction.metadata.name : '' // remove commenting once metaData in Redux
      notes = edgeTransaction.metadata.notes ? edgeTransaction.metadata.notes : ''
      if (edgeTransaction.metadata.amountFiat) {
        const initial = edgeTransaction.metadata.amountFiat.toFixed(2)
        const absoluteAmountFiat = bns.abs(initial)
        amountFiat = intl.formatNumber(bns.toFixed(absoluteAmountFiat, 2, 2))
      }
    }

    // if there is a user-entered category (type:subcategory)
    if (cat) {
      const colonOccurrence = cat.indexOf(':')
      if (cat && colonOccurrence) {
        type = cat.substring(0, colonOccurrence)
        type = type.charAt(0).toLowerCase() + type.slice(1)
        subCategory = cat.substring(colonOccurrence + 1, cat.length)
      }
    }

    // if type is still not defined then figure out if send or receive (expense vs income)
    if (!type || !types[type]) {
      if (direction === 'receive') {
        type = types.income.key
      } else {
        type = types.expense.key
      }
    } else {
      type = types[type].key
    }

    this.state = {
      name,
      notes,
      thumbnailPath: props.thumbnailPath,
      category: cat,
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
      type,
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
    this.refs._scrollView.scrollTo({ x: 0, y: 62, animated: true })
  }

  onBlurPayee = () => {
    this.disablePayeeVisibility()
    Keyboard.dismiss()
    this.refs._scrollView.scrollTo({ x: 0, y: 0, animated: true })
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

  onChangePayee = (contactName: string, thumbnailPath: string) => {
    this.setState({
      name: contactName,
      thumbnailPath: thumbnailPath
    })
  }

  onSelectPayee = (name: string, thumbnail: string) => {
    this.onChangePayee(name, thumbnail)
    this.onBlurPayee()
    this.refs._scrollView.scrollTo({ x: 0, y: 0, animated: true })
  }

  onChangeFiat = (input: string) => {
    // This next chained statement / expression is to ensure only one decimal place. Remember decimals are commas in some locales
    // double-check that this implementation change works!
    const newInputStripped = input
      .replace(/[^\d.,]/, '')
      .replace(/\./, 'x')
      .replace(/\./g, '')
      .replace(/x/, '.')
      .replace(/,/, 'x')
      .replace(/,/g, '')
      .replace(/x/, ',')
    const newInputFiltered =
      (isNaN(newInputStripped.replace(',', '.')) && (newInputStripped !== ',' && newInputStripped !== '.')) || newInputStripped === '' ? '' : newInputStripped
    this.setState({
      amountFiat: newInputFiltered
    })
  }

  onBlurFiat = () => {
    // needs badly to be flowed and / or research best practices for converting TextInput to float / fiat
    // keep in mind that TextField returns a string, and amountFiat will need to be a floating point number
    let amountFiat
    if (parseFloat(this.state.amountFiat)) {
      const amountFiatOneDecimal = this.state.amountFiat.toString().replace(/[^\d.,]/, '')
      const absoluteAmountFiatOneDecimal = bns.abs(amountFiatOneDecimal)
      amountFiat = bns.toFixed(absoluteAmountFiatOneDecimal, 2, 2)
    } else {
      amountFiat = intl.formatNumber('0.00')
    }
    this.setState({
      amountFiat
    })
  }

  onChangeCategory = (input: string) => {
    this.setState({
      type: input
    })
  }

  onChangeSubcategory = (input: string) => {
    this.setState({
      subCategory: input
    })
  }

  onChangeNotes = (input: string) => {
    this.setState({
      notes: input
    })
  }

  onFocusNotes = () => {
    this.refs._scrollView.scrollTo({ x: 0, y: 300, animated: true })
  }

  onBlurNotes = () => {
    Keyboard.dismiss()
    this.refs._scrollView.scrollTo({ x: 0, y: 0, animated: true })
  }

  onNotesKeyboardReturn = () => {
    this.onBlurNotes()
  }

  onEnterSubcategories = () => {
    this.refs._scrollView.scrollTo({ x: 0, y: 260, animated: true })
    this.enableSubcategoryVisibility()
  }

  onExitSubcategories = () => {
    // this.disableSubcategoryVisibility()
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
        if (categories.indexOf(stringArray[0].toLowerCase()) >= 0) {
          // if the type is of the 4 options
          this.setState({
            type: stringArray[0].toLowerCase(),
            subCategory: stringArray[1]
          })
          if (this.props.subcategoriesList.indexOf(input) === -1 && categories.indexOf(stringArray[0].toLowerCase()) >= 0) {
            // if this is a new subcategory and the parent category is an accepted type
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

  onEnterCategories = () => {
    this.setState({ categorySelectVisibility: true })
  }

  onExitCategories = () => {
    this.setState({ categorySelectVisibility: false })
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

  onSelectCategory = (type: string) => {
    this.setState({ type })
  }

  onFocusFiatAmount = () => {
    const { amountFiat } = this.state
    if (amountFiat === '0.00' || amountFiat === '0,00') {
      this.setState({
        amountFiat: ''
      })
    }
    this.refs._scrollView.scrollTo({ x: 0, y: 90, animated: true })
  }

  amountAreaOpenModal = () => {
    this.props.openHelpModal()
  }

  onPressAdvancedDetailsButton = () => {
    this.setState({
      isAdvancedTransactionDetailsModalVisible: true
    })
  }

  onExitAdvancedDetailsModal = () => {
    this.setState({
      isAdvancedTransactionDetailsModalVisible: false
    })
  }

  onSaveTxDetails = () => {
    const { name, notes, bizId, miscJson, type, subCategory, amountFiat } = this.state
    const { edgeTransaction } = this.props
    let category, finalAmountFiat
    if (type) {
      category = type.charAt(0).toUpperCase() + type.slice(1) + ':' + subCategory
    } else {
      category = undefined
    }
    const txid = edgeTransaction.txid
    const decimalAmountFiat = Number.parseFloat(amountFiat.replace(',', '.'))
    if (isNaN(decimalAmountFiat)) {
      // if invalid number set to previous saved amountFiat
      finalAmountFiat = edgeTransaction.metadata ? edgeTransaction.metadata.amountFiat : 0.0
    } else {
      // if a valid number or empty string then set to zero (empty) or actual number
      finalAmountFiat = !amountFiat ? 0.0 : decimalAmountFiat
    }
    const edgeMetadata: EdgeMetadata = { name, category, notes, amountFiat: finalAmountFiat, bizId, miscJson }
    this.props.setTransactionDetails(txid, edgeTransaction.currencyCode, edgeMetadata)
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

  render () {
    const sortedSubcategories = this.props.subcategoriesList.length > 0 ? this.props.subcategoriesList.sort() : []
    let txExplorerLink = null
    if (this.props.currencyInfo) {
      txExplorerLink = sprintf(this.props.currencyInfo.transactionExplorer, this.props.edgeTransaction.txid)
    }

    const categoryColor = types[this.state.type].color

    return (
      <SafeAreaView>
        <View style={[{ width: '100%', height: PLATFORM.usableHeight + PLATFORM.toolbarHeight }]}>
          <Gradient style={styles.headerGradient} />
          <View style={{ position: 'relative', top: scale(66) }}>
            <AdvancedTransactionDetailsModal
              onExit={this.onExitAdvancedDetailsModal}
              isActive={this.state.isAdvancedTransactionDetailsModalVisible}
              txExplorerUrl={txExplorerLink}
              txid={this.props.edgeTransaction.txid}
            />
            {this.state.contactSearchVisibility && (
              <Animated.View
                id="payeeSearchResults"
                style={[
                  {
                    opacity: this.state.payeeOpacity,
                    width: '100%',
                    backgroundColor: THEME.COLORS.WHITE,
                    position: 'absolute',
                    top: scale(4),
                    height: scale(PLATFORM.usableHeight),
                    zIndex: 99999
                  }
                ]}
              >
                <View style={[styles.payeeNameArea]}>
                  <View style={[styles.payeeNameWrap]}>
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
                      defaultValue={this.state.name}
                      placeholderTextColor={THEME.COLORS.GRAY_2}
                      returnKeyType={'done'}
                    />
                  </View>
                </View>
                <ContactSearchResults
                  onChangePayee={this.onSelectPayee}
                  contacts={this.props.contacts}
                  style={[{ width: '100%' }]}
                  usableHeight={PLATFORM.usableHeight}
                  currentPayeeText={this.state.name || ''}
                  onSelectPayee={this.onSelectPayee}
                  blurOnSubmit
                  onBlur={this.onBlurPayee}
                />
              </Animated.View>
            )}
            {this.state.subCategorySelectVisibility && (
              <Animated.View
                id="subcategorySearchResults"
                style={[
                  {
                    opacity: this.state.subcategoryOpacity,
                    width: '100%',
                    backgroundColor: THEME.COLORS.WHITE,
                    position: 'absolute',
                    height: PLATFORM.usableHeight,
                    zIndex: 99999
                  }
                ]}
              >
                <View style={[styles.modalCategoryRow]}>
                  <TouchableOpacity style={[styles.categoryLeft, { borderColor: categoryColor }]} disabled>
                    <FormattedText style={[{ color: categoryColor }, styles.categoryLeftText]}>{types[this.state.type].syntax}</FormattedText>
                  </TouchableOpacity>
                  <View style={[styles.modalCategoryInputArea]}>
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
                  onPressFxn={this.onSelectSubCategory}
                  enteredSubcategory={this.state.subCategory}
                  usableHeight={PLATFORM.usableHeight}
                  subcategoriesList={sortedSubcategories}
                />
              </Animated.View>
            )}
            <ScrollView keyboardShouldPersistTaps="handled" ref="_scrollView" scrollEnabled={!this.state.subCategorySelectVisibility} overScrollMode="never">
              <View style={[styles.container]}>
                <View>
                  <Gradient style={[styles.expandedHeader]}>
                    <PayeeIcon direction={this.state.direction} thumbnailPath={this.state.thumbnailPath} />
                  </Gradient>
                </View>
                <View style={[styles.dataArea]}>
                  <View style={[styles.payeeNameArea]}>
                    <View style={[styles.payeeNameWrap]}>
                      <TextInput
                        underlineColorAndroid={'transparent'}
                        autoCapitalize="words"
                        onFocus={this.onFocusPayee}
                        autoCorrect={false}
                        style={[styles.payeeNameInput, inputBottomPadding()]}
                        placeholder={s.strings.transaction_details_payee}
                        defaultValue={this.state.name}
                        placeholderTextColor={THEME.COLORS.GRAY_2}
                      />
                    </View>
                  </View>
                  <View style={styles.payeeSeperator} />
                  <View style={[styles.dateWrap]}>
                    <FormattedText style={[styles.date]}>{this.state.displayDate}</FormattedText>
                  </View>
                  <AmountArea
                    edgeTransaction={this.props.edgeTransaction}
                    onChangeNotesFxn={this.onChangeNotes}
                    onChangeCategoryFxn={this.onChangeCategory}
                    onChangeFiatFxn={this.onChangeFiat}
                    onBlurFiatFxn={this.onBlurFiat}
                    onPressFxn={this.onSaveTxDetails}
                    fiatCurrencyCode={this.guiWallet.fiatCurrencyCode}
                    cryptoCurrencyCode={this.props.edgeTransaction.currencyCode}
                    fiatCurrencySymbol={this.fiatSymbol}
                    fiatAmount={this.state.amountFiat}
                    onEnterSubcategories={this.onEnterSubcategories}
                    subCategorySelectVisibility={this.state.subCategorySelectVisibility}
                    categorySelectVisibility={this.state.categorySelectVisibility}
                    onSelectSubCategory={this.onSelectSubCategory}
                    subCategory={this.state.subCategory}
                    type={this.state.type}
                    onEnterCategories={this.onEnterCategories}
                    onExitCategories={this.onExitCategories}
                    usableHeight={PLATFORM.usableHeight}
                    onSubcategoryKeyboardReturn={this.onSubcategoriesKeyboardReturn}
                    onNotesKeyboardReturn={this.onNotesKeyboardReturn}
                    onFocusNotes={this.onFocusNotes}
                    onBlurNotes={this.onBlurNotes}
                    direction={this.state.direction}
                    color={categoryColor}
                    types={types}
                    onFocusFiatAmount={this.onFocusFiatAmount}
                    walletDefaultDenomProps={this.state.walletDefaultDenomProps}
                    openModalFxn={this.amountAreaOpenModal}
                    guiWallet={this.guiWallet}
                    onSelectCategory={this.onSelectCategory}
                    onPressAdvancedDetailsButton={this.onPressAdvancedDetailsButton}
                    txExplorerUrl={txExplorerLink}
                  />
                </View>
              </View>
              <View style={{ height: 300 }} />
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    )
  }
}
