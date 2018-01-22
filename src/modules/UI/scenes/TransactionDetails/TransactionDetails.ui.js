// @flow

import React, {Component} from 'react'
import s from '../../../../locales/strings.js'
import {
  Animated,
  Easing,
  TextInput,
  ScrollView,
  View,
  TouchableOpacity,
  Keyboard
} from 'react-native'
import Permissions from 'react-native-permissions'
import {bns} from 'biggystring'
import {sprintf} from 'sprintf-js'
import Contacts from 'react-native-contacts'
import ContactSearchResults from './ContactSearchResults.ui.js'
import FormattedText from '../../components/FormattedText/index'
import SafeAreaView from '../../components/SafeAreaView'
import Gradient from '../../components/Gradient/Gradient.ui'
import styles, {styles as styleRaw} from './style'
import THEME from '../../../../theme/variables/airbitz'
import * as UTILS from '../../../utils'
import AmountArea from './AmountArea.ui.js'
import SubCategorySelect from './SubCategorySelect.ui.js'
import PayeeIcon from '../../components/PayeeIcon/PayeeIcon.ui.js'
import type {GuiContact, GuiWallet} from '../../../../types.js'
import platform from '../../../../theme/variables/platform.js'
import type {AbcDenomination, AbcTransaction, AbcMetadata, AbcCurrencyInfo} from 'airbitz-core-types'

const categories = ['income', 'expense', 'exchange', 'transfer']

export type Props = {
  abcTransaction: AbcTransaction,
  contacts: Array<GuiContact>,
  subcategoriesList: Array<string>,
  settings: any, // TODO: This badly needs to get typed but it is a huge dynamically generated object with embedded maps -paulvp,
  direction: string,
  thumbnailPath: string,
  currencyInfo: AbcCurrencyInfo | null,
  currencyCode: string,
  wallets: Array<GuiWallet>
}

export type DispatchProps = {
  setNewSubcategory: (string, Array<string>) => void,
  openHelpModal: () => void,
  setTransactionDetails: (string, string, AbcMetadata) => void,
  setContactList: (Array<GuiContact>) => void,
  getSubcategories: () => void,
  displayDropdownAlert: (string, string) => void
}

export type State = {
  name: string, // remove commenting once metaData in Redux
  thumbnailPath: string,
  // hasThumbnail: boolean,
  category: string,
  notes: string,
  amountFiat: string,
  direction: string,
  bizId: number,
  miscJson: any,
  dateTimeSyntax: string,
  subCategorySelectVisibility: boolean,
  categorySelectVisibility: boolean,
  subCategory: string,
  contactSearchVisibility: boolean,
  animation: any, // AnimatedValue
  payeeOpacity: any, // AnimatedValue
  subcategoryOpacity: any, // AnimatedValue
  payeeZIndex: number,
  subcatZIndex: number,
  type: string,
  walletDefaultDenomProps: AbcDenomination
}

const EXCHANGE_TEXT = s.strings.fragment_transaction_exchange
const EXPENSE_TEXT = s.strings.fragment_transaction_expense
const TRANSFER_TEXT = s.strings.fragment_transaction_transfer
const INCOME_TEXT = s.strings.fragment_transaction_income

export class TransactionDetails extends Component<Props & DispatchProps, State> {
  guiWallet: GuiWallet
  fiatSymbol: string

  constructor (props: Props & DispatchProps) {
    super(props)
    const dateTime = new Date(props.abcTransaction.date * 1000)
    const dateString = dateTime.toLocaleDateString('en-US', {month: 'short', day: '2-digit', year: 'numeric'})
    const timeString = dateTime.toLocaleTimeString('en-US', {hour: 'numeric', minute: 'numeric', second: 'numeric'})
    let type = ''
    let subCategory = ''
    let cat = ''
    let name = ''
    let amountFiat = '0.00'
    let notes = ''
    if (props.abcTransaction.wallet) {
      this.guiWallet = props.wallets[props.abcTransaction.wallet.id]
      this.fiatSymbol = UTILS.getFiatSymbol(this.guiWallet.fiatCurrencyCode)
    } else {
      this.props.displayDropdownAlert(s.strings.transaction_detail_no_wallet, s.strings.transaction_detail_unable_to_load_transaction)
    }

    if (props.abcTransaction && props.abcTransaction.metadata) {
      cat = props.abcTransaction.metadata.category ? props.abcTransaction.metadata.category : ''
      name = props.abcTransaction.metadata.name ? props.abcTransaction.metadata.name : '' // remove commenting once metaData in Redux
      notes = props.abcTransaction.metadata.notes ? props.abcTransaction.metadata.notes : ''
      if (props.abcTransaction.metadata.amountFiat) {
        const initial = props.abcTransaction.metadata.amountFiat.toFixed(2)
        amountFiat = bns.abs(initial)
        amountFiat = bns.toFixed(amountFiat, 2, 2)
      }
    }

    if (cat) {
      const colonOccurrence = cat.indexOf(':')
      if (cat && colonOccurrence) {
        type = cat.substring(0, colonOccurrence)
        type = type.charAt(0).toLowerCase() + type.slice(1)
        subCategory = cat.substring(colonOccurrence + 1, cat.length)
      }
    }

    this.state = {
      name,
      notes,
      thumbnailPath: props.thumbnailPath,
      category: cat,
      amountFiat,
      bizId: 0,
      direction: (parseInt(props.abcTransaction.nativeAmount) >= 0) ? 'receive' : 'send',
      miscJson: props.abcTransaction.metadata ? props.abcTransaction.metadata.miscJson : null,
      dateTimeSyntax: dateString + ' ' + timeString,
      subCategorySelectVisibility: false,
      categorySelectVisibility: false,
      subCategory: subCategory || '',
      contactSearchVisibility: false,
      animation: new Animated.Value(0),
      payeeOpacity: new Animated.Value(0),
      subcategoryOpacity: new Animated.Value(0),
      payeeZIndex: 0,
      subcatZIndex: 0,
      type: type,
      walletDefaultDenomProps: {
        name: '',
        multiplier: '',
        symbol: ''
      }
    }
  }

  onFocusPayee = () => {
    this.enablePayeeVisibility()
    this.refs._scrollView.scrollTo({x: 0, y: 62, animated: true})
  }

  onBlurPayee = () => {
    this.disablePayeeVisibility()
    Keyboard.dismiss()
    this.refs._scrollView.scrollTo({x: 0, y: 0, animated: true})
  }

  enablePayeeVisibility = () => {
    const toOpacity = 1
    this.setState({contactSearchVisibility: true, payeeZIndex: 99999}, () => {
      Animated.timing(
        this.state.payeeOpacity,
        {
          toValue: toOpacity,
          easing: Easing.ease,
          duration: 200,
          delay: 0,
          useNativeDriver: true
        }
        ).start()
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
    this.refs._scrollView.scrollTo({x: 0, y: 0, animated: true})
  }

  onChangeFiat = (input: string) => {
    // This next chained statement / expression is to ensure only one decimal place. Remember decimals are commas in some locales
    // double-check that this implementation change works!
    const newInputStripped = input.replace(/[^\d.,]/, '').replace(/\./, 'x')
    .replace(/\./g, '')
    .replace(/x/, '.')
    .replace(/,/, 'x')
    .replace(/,/g, '')
    .replace(/x/, ',')
    const newInputFiltered = ((isNaN(newInputStripped.replace(',', '.')) && (newInputStripped !== ',' && newInputStripped !== '.')) || (newInputStripped === '')) ? '' : newInputStripped
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
      amountFiat = '0.00'
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
    this.refs._scrollView.scrollTo({x: 0, y: 300, animated: true})
  }

  onBlurNotes = () => {
    Keyboard.dismiss()
    this.refs._scrollView.scrollTo({x: 0, y: 0, animated: true})
  }

  onNotesKeyboardReturn = () => {
    this.onBlurNotes()
  }

  onEnterSubcategories = () => {
    this.refs._scrollView.scrollTo({x: 0, y: 260, animated: true})
    this.enableSubcategoryVisibility()
  }

  onExitSubcategories = () => {
    // this.disableSubcategoryVisibility()
  }

  onSubcategoriesKeyboardReturn = () => {
    this.disableSubcategoryVisibility()
    this.refs._scrollView.scrollTo({x: 0, y: 0, animated: true})
  }

  onSelectSubCategory = (input: string) => {
    let stringArray
    // check if there is a colon that delineates category and subcategory
    if (!input) {
      this.setState({
        subCategory: ''
      })
    } else { // if input *does* exist
      const colonOccurrence = input.indexOf(':')
      if (colonOccurrence) { // if it *does* have a colon in it
        stringArray = [input.substring(0, colonOccurrence), input.substring(colonOccurrence + 1, input.length)]
        // console.log('stringArray is: ', stringArray)
        if (categories.indexOf(stringArray[0].toLowerCase()) >= 0) { // if the type is of the 4 options
          this.setState({
            type: stringArray[0].toLowerCase(),
            subCategory: stringArray[1]
          })
          if ((this.props.subcategoriesList.indexOf(input) === -1) && (categories.indexOf(stringArray[0]) >= 0)) { // if this is a new subcategory and the parent category is an accepted type
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
    this.refs._scrollView.scrollTo({x: 0, y: 0, animated: true})
  }

  addNewSubcategory = (newSubcategory: string) => {
    this.props.setNewSubcategory(newSubcategory, this.props.subcategoriesList)
  }

  onEnterCategories = () => {
    this.setState({categorySelectVisibility: true})
  }

  onExitCategories = () => {
    this.setState({categorySelectVisibility: false})
  }

  enableSubcategoryVisibility = () => {
    const toOpacity = 1
    this.setState({subCategorySelectVisibility: true, subcatZIndex: 99999}, () => {
      Animated.timing(
        this.state.subcategoryOpacity,
        {
          toValue: toOpacity,
          easing: Easing.ease,
          duration: 200,
          delay: 100,
          useNativeDriver: true
        }
      ).start()
    }
    )
  }

  disableSubcategoryVisibility = () => {
    this.state.subcategoryOpacity.setValue(0)
    this.setState({
      subCategorySelectVisibility: false,
      subcatZIndex: 0
    })
  }

  onSelectCategory = (type: any) => {
    this.setState({type})
  }

  onFocusFiatAmount = () => {
    this.refs._scrollView.scrollTo({x: 0, y: 90, animated: true})
  }

  amountAreaOpenModal = () => {
    this.props.openHelpModal()
  }

  onSaveTxDetails = () => {
    let category
    if (this.state.type) {
      category = this.state.type.charAt(0).toUpperCase() + this.state.type.slice(1) + ':' + this.state.subCategory
    } else {
      category = undefined
    }
    const {name, notes, bizId, miscJson} = this.state
    const txid = this.props.abcTransaction.txid
    const newAmountFiat = this.state.amountFiat
    const amountFiat:number = (!newAmountFiat) ? 0.00 : Number.parseFloat(newAmountFiat)
    const abcMetadata: AbcMetadata = {name, category, notes, amountFiat, bizId, miscJson}
    this.props.setTransactionDetails(txid, this.guiWallet.currencyCode, abcMetadata)
  }

  componentDidMount () {
    if (!this.props.contacts) {
      Permissions.check('contacts').then((response) => {
        if (response === 'authorized') {
          Contacts.getAll((err, contacts) => {
            if (err === 'denied') {
              // error
            } else {
              contacts.sort((a, b) => a.givenName > b.givenName)
              this.props.setContactList(contacts)
            }
          })
        }
      })
    }
    this.props.getSubcategories()
  }

  componentWillMount () {
    // check if metaToken, is not then do not set walletDefaultProps to anything other than initial blank values
    if (UTILS.isCryptoParentCurrency(this.guiWallet, this.props.abcTransaction.currencyCode)) {
      this.setState({walletDefaultDenomProps: UTILS.getWalletDefaultDenomProps(this.guiWallet, this.props.settings)})
    } else {
      this.setState({walletDefaultDenomProps: UTILS.getWalletDefaultDenomProps(this.guiWallet, this.props.settings, this.props.abcTransaction.currencyCode)})
    }
  }

  render () {
    let type

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

    if (!this.state.type) {
      if (this.state.direction === 'receive') {
        type = types.income
      } else {
        type = types.expense
      }
    } else {
      type = types[this.state.type]
    }

    const categoryColor = type.color
    const sortedSubcategories = this.props.subcategoriesList.length > 0 ? this.props.subcategoriesList.sort() : []
    let txExplorerLink = null
    if (this.props.currencyInfo) {
      txExplorerLink = sprintf(this.props.currencyInfo.transactionExplorer, this.props.abcTransaction.txid)
    }
    return (
      <SafeAreaView>
        <View style={[{width: '100%', height: platform.usableHeight + platform.toolbarHeight}, UTILS.border()]}>
          <Gradient style={styles.headerGradient} />
          <View style={{position: 'relative', top: 66}}>
            {this.state.contactSearchVisibility &&
              <Animated.View id='payeeSearchResults'
                style={[{
                  opacity: this.state.payeeOpacity,
                  width: '100%',
                  backgroundColor: THEME.COLORS.WHITE,
                  position: 'absolute',
                  top: 4,
                  height: platform.usableHeight,
                  zIndex: 99999
                }]}>
                <View style={[styles.payeeNameArea]}>
                  <View style={[styles.payeeNameWrap]}>
                    <TextInput
                      underlineColorAndroid={'transparent'}
                      autoFocus
                      blurOnSubmit
                      onSubmitEditing={this.onBlurPayee}
                      autoCapitalize='words'
                      autoCorrect={false}
                      onChangeText={this.onChangePayee}
                      style={[styles.payeeNameInput, UTILS.inputBottomPadding()]}
                      placeholder='Payee'
                      defaultValue={this.state.name}
                      placeholderTextColor={THEME.COLORS.GRAY_2}
                      returnKeyType={'done'}
                    />
                  </View>
                </View>
                <ContactSearchResults
                  onChangePayee={this.onSelectPayee}
                  contacts={this.props.contacts}
                  style={[{width: '100%'}]}
                  usableHeight={platform.usableHeight}
                  currentPayeeText={this.state.name || ''}
                  dimensions={platform.dimensions}
                  onSelectPayee={this.onSelectPayee}
                  blurOnSubmit
                  onBlur={this.onBlurPayee}
                />
              </Animated.View>
            }
            {this.state.subCategorySelectVisibility &&
                <Animated.View id='subcategorySearchResults'
                  style={[{
                    opacity: this.state.subcategoryOpacity,
                    width: '100%',
                    backgroundColor: THEME.COLORS.WHITE,
                    position: 'absolute',
                    height: platform.usableHeight,
                    zIndex: 99999
                  }]}
                >
                  <View style={[styles.modalCategoryRow]}>
                    <TouchableOpacity style={[styles.categoryLeft, {borderColor: categoryColor}]} disabled>
                      <FormattedText style={[{color: categoryColor}, styles.categoryLeftText]}>{type.syntax}</FormattedText>
                    </TouchableOpacity>
                    <View style={[styles.modalCategoryInputArea]}>
                      <TextInput
                        underlineColorAndroid={'transparent'}
                        autoFocus
                        blurOnSubmit
                        autoCapitalize='words'
                        onBlur={this.onExitSubcategories}
                        onChangeText={this.onChangeSubcategory}
                        style={[styles.categoryInput, UTILS.inputBottomPadding()]}
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
                    usableHeight={platform.usableHeight}
                    subcategoriesList={sortedSubcategories}
                  />
                </Animated.View>
            }
            <ScrollView keyboardShouldPersistTaps='handled' style={UTILS.border()} ref='_scrollView' scrollEnabled={!this.state.subCategorySelectVisibility} overScrollMode='never' /* alwaysBounceVertical={false} */ bounces={false} >
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
                        autoCapitalize='words'
                        onFocus={this.onFocusPayee}
                        autoCorrect={false}
                        style={[styles.payeeNameInput, UTILS.inputBottomPadding()]}
                        placeholder={s.strings.transaction_details_payee}
                        defaultValue={this.state.name}
                        placeholderTextColor={THEME.COLORS.GRAY_2}
                      />
                    </View>
                  </View>
                  <View style={styles.payeeSeperator} />
                  <View style={[styles.dateWrap]}>
                    <FormattedText style={[styles.date]}>{this.state.dateTimeSyntax}</FormattedText>
                  </View>
                  <AmountArea
                    abcTransaction={this.props.abcTransaction}
                    onChangeNotesFxn={this.onChangeNotes}
                    onChangeCategoryFxn={this.onChangeCategory}
                    onChangeFiatFxn={this.onChangeFiat}
                    onBlurFiatFxn={this.onBlurFiat}
                    onPressFxn={this.onSaveTxDetails}
                    fiatCurrencyCode={this.guiWallet.fiatCurrencyCode}
                    cryptoCurrencyCode={this.props.abcTransaction.currencyCode}
                    fiatCurrencySymbol={this.fiatSymbol}
                    fiatAmount={this.state.amountFiat}
                    onEnterSubcategories={this.onEnterSubcategories}
                    subCategorySelectVisibility={this.state.subCategorySelectVisibility}
                    categorySelectVisibility={this.state.categorySelectVisibility}
                    onSelectSubCategory={this.onSelectSubCategory}
                    subCategory={this.state.subCategory}
                    type={type}
                    onEnterCategories={this.onEnterCategories}
                    onExitCategories={this.onExitCategories}
                    usableHeight={platform.usableHeight}
                    onSubcategoryKeyboardReturn={this.onSubcategoriesKeyboardReturn}
                    dimensions={platform.dimensions}
                    onNotesKeyboardReturn={this.onNotesKeyboardReturn}
                    onFocusNotes={this.onFocusNotes}
                    onBlurNotes={this.onBlurNotes}
                    direction={this.state.direction}
                    color={categoryColor}
                    types={types}
                    onFocusFiatAmount={this.onFocusFiatAmount}
                    walletDefaultDenomProps={this.state.walletDefaultDenomProps}
                    openModalFxn={this.amountAreaOpenModal}
                    txExplorerUrl={txExplorerLink}
                    guiWallet={this.guiWallet}
                    onSelectCategory={this.onSelectCategory}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    )
  }
}
