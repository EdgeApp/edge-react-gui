import React, {Component} from 'react'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import {
  Animated,
  Easing,
  Image,
  TextInput,
  ScrollView,
  View,
  TouchableHighlight,
  Picker,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native'

import Modal from 'react-native-modal'
import Permissions from 'react-native-permissions'
import Contacts from 'react-native-contacts'
import {setContactList} from '../../contacts/action'
import ReceivedIcon from '../../../../assets/images/transactions/transaction-details-received.png'
import SentIcon from '../../../../assets/images/transactions/transaction-details-sent.png'
import ContactImage from '../../../../assets/images/contact.png'
import T from '../../components/FormattedText'
import {PrimaryButton} from '../../components/Buttons'
import {connect} from 'react-redux'
import Gradient from '../../components/Gradient/Gradient.ui'
import styles from './style'
import {colors as c} from '../../../../theme/variables/airbitz'
import * as UTILS from '../../../utils'
import {
  setTransactionDetails,
  setNewSubcategory,
  getSubcategories
  // setSubcategories,
  // setSubcategoriesRequest
} from './action.js'
import * as UI_SELECTORS from '../../selectors.js'
import SearchResults from '../../components/SearchResults/index'
import {openHelpModal} from '../../components/HelpModal/actions'
import platform from '../../../../theme/variables/platform.js'

const categories = ['income', 'expense', 'exchange', 'transfer']

class TransactionDetails extends Component {
  constructor (props) {
    super(props)
    // console.log('inside txDetails constructor, this.props is: ', this.props)
    const direction = (this.props.tx.amountSatoshi >= 0) ? 'receive' : 'send'
    const dateTime = new Date(this.props.tx.date * 1000)
    const dateString = dateTime.toLocaleDateString('en-US', {month: 'short', day: '2-digit', year: 'numeric'})
    const timeString = dateTime.toLocaleTimeString('en-US', {hour: 'numeric', minute: 'numeric', second: 'numeric'})
    let type, subCategory
    if (this.props.tx.metadata.category) {
      let colonOccurrence = this.props.tx.metadata.category.indexOf(':')
      if (colonOccurrence) {
        type = this.props.tx.metadata.category.substring(0, colonOccurrence)
        type = type.charAt(0).toLowerCase() + type.slice(1)
        subCategory = this.props.tx.metadata.category.substring(colonOccurrence + 1, this.props.tx.metadata.category.length)
      }
    }

    let amountFiat = this.props.tx.metadata.amountFiat || '0'

    this.state = {
      tx: this.props.tx,
      direction,
      txid: this.props.tx.txid,
      name: this.props.tx.metadata.name, // remove commenting once metaData in Redux
      thumbnailPath: this.props.thumbnailPath,
      category: this.props.tx.metadata.category,
      notes: this.props.tx.metadata.notes,
      amountFiat: amountFiat,
      bizId: 0,
      miscJson: this.props.tx.miscJson || null,
      dateTimeSyntax: dateString + ' ' + timeString,
      subCategorySelectVisibility: false,
      categorySelectVisibility: false,
      subCategory: subCategory || null,
      contactSearchVisibility: false,
      animation: new Animated.Value(0),
      payeeOpacity: new Animated.Value(0),
      subcategoryOpacity: new Animated.Value(0),
      payeeZIndex: 0,
      subcatZIndex: 0,
      type: type,
      walletDefaultDenomProps: {}
    }
  }

  onFocusPayee = () => {
    this.enablePayeeVisibility()
    this.refs._scrollView.scrollTo({x: 0, y: 62, animated: true})
    this.payeeTextInput.focus()
  }

  onBlurPayee = () => {
    this.disablePayeeVisibility()
    Keyboard.dismiss()
    this.refs._scrollView.scrollTo({x: 0, y: 0, animated: true})
  }

  enablePayeeVisibility = () => {
    let toOpacity
    toOpacity = 1
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

  onChangePayee = (contactName, thumbnailPath) => {
    this.setState({
      name: contactName,
      thumbnailPath: thumbnailPath
    })
  }

  onSelectPayee = (name, thumbnail) => {
    this.onChangePayee(name, thumbnail)
    this.onBlurPayee()
    this.refs._scrollView.scrollTo({x: 0, y: 0, animated: true})
  }

  onChangeFiat = (input) => {
    let newInputStripped, newInputFiltered
    // This next chained statement / expression is to ensure only one decimal place. Remember decimals are commas in some locales
    newInputStripped = input.replace(/[^\d.,]/, '').replace(/\./, 'x')
    .replace(/\./g, '')
    .replace(/x/, '.')
    .replace(/\,/, 'x')
    .replace(/\,/g, '')
    .replace(/x/, ',')
    // console.log('onChangeFiat being executed, input is: ', input)
    newInputFiltered = ((isNaN(newInputStripped.replace(',', '.')) && (newInputStripped != ',' && newInputStripped != '.')) || (newInputStripped === '')) ? '' : newInputStripped
    // console.log('onChangeFiat, now newInput is: ', newInput)
    this.setState({
      amountFiat: newInputFiltered
    })
  }

  onBlurFiat = () => {
    // needs badly to be flowed and / or research best practices for converting TextInput to float / fiat
    // keep in mind that TextField returns a string, and amountFiat will need to be a floating point number
    let amountFiat
    if (parseFloat(this.state.amountFiat)) {
      let amountFiatOneDecimal = this.state.amountFiat.toString().replace(/[^\d.,]/, '')
      let absoluteAmountFiatOneDecimal = Math.abs(parseFloat(amountFiatOneDecimal))
      let stringifiedAbsoluteAmountFiatOneDecimal = absoluteAmountFiatOneDecimal.toString()
      amountFiat = UTILS.addFiatTwoDecimals(UTILS.truncateDecimals(stringifiedAbsoluteAmountFiatOneDecimal, 2))
    } else {
      amountFiat = '0.00'
    }
    this.setState({
      amountFiat
    })
  }

  onChangeCategory = (input) => {
    this.setState({
      type: input
    })
  }

  onChangeSubcategory = (input) => {
    this.setState({
      subCategory: input
    })
  }

  onChangeNotes = (input) => {
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
    this.subcategoryTextInput.focus()
  }

  onExitSubcategories = () => {
    // this._toggleSubcategoryVisibility()
  }

  onSubcategoriesKeyboardReturn = () => {
    this.disableSubcategoryVisibility()
    this.refs._scrollView.scrollTo({x: 0, y: 0, animated: true})
  }

  onSelectSubCategory = (input) => {
    let stringArray
    // check if there is a colon that delineates category and subcategory
    if (!input) {
      this.setState({
        subCategory: ''
      })
    } else {
      let colonOccurrence = input.indexOf(':')
      if (colonOccurrence) {
        stringArray = [input.substring(0, colonOccurrence), input.substring(colonOccurrence + 1, input.length)]
        // console.log('stringArray is: ', stringArray)
        if (categories.indexOf(stringArray[0].toLowerCase()) >= 0) { // if the type is of the 4 options
          this.setState({
            type: stringArray[0].toLowerCase(),
            subCategory: stringArray[1]
          })
          if ((this.props.subcategoriesList.indexOf(input) === -1) && categories.indexOf(stringArray[0] >= 0)) { // if this is a new subcategory and the parent category is an accepted type
            this.addNewSubcategory(input)
          }
        } else {
          this.setState({
            subCategory: stringArray[1]
          })
        }
      } else {
        this.setState({
          subCategory: stringArray[1]
        })
      }
    }
    this.disableSubcategoryVisibility()
    Keyboard.dismiss()
    this.refs._scrollView.scrollTo({x: 0, y: 0, animated: true})
  }

  addNewSubcategory = (newSubcategory) => {
    this.props.dispatch(setNewSubcategory(newSubcategory, this.props.subcategoriesList))
  }

  onEnterCategories = () => {
    this.setState({categorySelectVisibility: true})
  }

  onExitCategories = () => {
    this.setState({categorySelectVisibility: false})
  }

  enableSubcategoryVisibility = () => {
    let toOpacity = 1
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

  onSelectCategory = (item) => {
    this.setState({type: item.itemValue})
    this.onExitCategories()
  }

  onFocusFiatAmount = () => {
    this.refs._scrollView.scrollTo({x: 0, y: 90, animated: true})
  }

  onSaveTxDetails = () => {
    let amountFiat
    let category
    if (this.state.type && this.state.subCategory) {
      category = this.state.type.charAt(0).toUpperCase() + this.state.type.slice(1) + ':' + this.state.subCategory
    } else {
      category = undefined
    }
    const {txid, name, notes, bizId, miscJson} = this.state
    let newAmountFiat = this.state.amountFiat
    amountFiat = (!newAmountFiat) ? 0.00 : Number.parseFloat(newAmountFiat).toFixed(2)
    const transactionDetails = {txid, name, category, notes, amountFiat, bizId, miscJson}
    this.props.setTransactionDetails(this.props.selectedWallet.currencyCode, transactionDetails)
  }

  componentDidMount () {
    const permissionStatus = ['authorized', 'undetermined']
    if (!this.props.contacts) {
      Permissions.check('contacts').then((response) => {
        if (permissionStatus.indexOf(response)) {
          Contacts.getAll((err, contacts) => {
            if (err === 'denied') {
              // error
            } else {
              contacts.sort((a, b) => a.givenName > b.givenName)
              this.props.dispatch(setContactList(contacts))
            }
          })
        }
      })
    }

    this.props.dispatch(getSubcategories())
  }

  componentWillMount () {
    this.setState({walletDefaultDenomProps: UTILS.getWalletDefaultDenomProps(this.props.selectedWallet, this.props.settings)})
  }

  render () {
    let leftData, feeSyntax, type

    const types = {
      exchange: {
        color: c.accentOrange,
        syntax: sprintf(strings.enUS['fragment_transaction_exchange']),
        key: 'exchange'
      },
      expense: {
        color: c.accentRed,
        syntax: sprintf(strings.enUS['fragment_transaction_expense']),
        key: 'expense'
      },
      transfer: {
        color: c.primary,
        syntax: sprintf(strings.enUS['fragment_transaction_transfer']),
        key: 'transfer'
      },
      income: {
        color: c.accentGreen,
        syntax: sprintf(strings.enUS['fragment_transaction_income']),
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

    if (this.state.direction === 'receive') {
      feeSyntax = ''
      leftData = {color: c.accentGreen, syntax: sprintf(strings.enUS['fragment_transaction_income'])}
    } else {
      feeSyntax = sprintf(strings.enUS['fragmet_tx_detail_mining_fee'], this.props.tx.networkFee)
      leftData = {color: c.accentRed, syntax: sprintf(strings.enUS['fragment_transaction_expense'])}
    }
    let color = type.color
    // console.log('rendering txDetails, this is: ', this)
    return (
      <View style={[UTILS.border()]}>
        <Animated.View
          style={[{opacity: this.state.payeeOpacity, width: '100%', zIndex: this.state.payeeZIndex, backgroundColor: 'white', position: 'absolute', top: 4, height: this.props.usableHeight}]}
          >
          <View style={[styles.payeeNameArea]}>
            <View style={[styles.payeeNameWrap]}>
              <TextInput
                ref={(component) => { this.payeeTextInput = component }}
                blurOnSubmit
                onSubmitEditing={this.onBlurPayee}
                autoCapitalize='words'
                autoCorrect={false}
                onChangeText={this.onChangePayee}
                style={[styles.payeeNameInput]}
                placeholder='Payee'
                defaultValue={this.state.name}
                value={this.state.name}
                placeholderTextColor={c.gray2}
                returnKeyType={'done'}
              />
            </View>
          </View>
          <ContactSearchResults
            onChangePayee={this.onSelectPayee}
            contacts={this.props.contacts}
            style={[{width: '100%'}]}
            usableHeight={this.props.usableHeight}
            currentPayeeText={this.state.name || ''}
            onSelectPayee={this.onSelectPayee}
            blurOnSubmit
            onBlur={this.onBlurPayee}
          />
        </Animated.View>
        <Animated.View
          style={[{opacity: this.state.subcategoryOpacity, width: '100%', zIndex: this.state.subcatZIndex, backgroundColor: 'white', position: 'absolute', height: this.props.usableHeight}]}
          >
          <View style={[styles.modalCategoryRow]}>
            <TouchableOpacity style={[styles.categoryLeft, {borderColor: color}]} disabled>
              <T style={[{color: color}, styles.categoryLeftText]}>{type.syntax}</T>
            </TouchableOpacity>
            <View style={[styles.modalCategoryInputArea]}>
              <TextInput
                ref={(component) => { this.subcategoryTextInput = component }}
                blurOnSubmit
                autoCapitalize='words'
                onBlur={this.onExitSubcategories}
                onChangeText={this.onChangeSubcategory}
                style={[styles.categoryInput]}
                defaultValue={this.state.subCategory || ''}
                placeholder={sprintf(strings.enUS['transaction_details_category_title'])}
                autoCorrect={false}
                onSubmitEditing={this.onSubcategoriesKeyboardReturn}
                placeholderTextColor={c.gray2}
                initialNumToRender={8}
                returnKeyType={'done'}
              />
            </View>
          </View>
          <SubCategorySelectConnect
            onPressFxn={this.onSelectSubCategory}
            enteredSubcategory={this.state.subCategory}
            usableHeight={this.props.usableHeight}
            subcategoriesList={this.props.subcategoriesList.sort()}
          />
        </Animated.View>
        <ScrollView keyboardShouldPersistTaps='handled' style={UTILS.border()} ref='_scrollView' scrollEnabled={!this.state.subCategorySelectVisibility} overScrollMode='never' /* alwaysBounceVertical={false} */ bounces={false} >
          <View style={[styles.container]}>
            <View>
              <Gradient style={[styles.expandedHeader]}>
                <PayeeIcon direction={this.state.direction} thumbnailPath={this.state.thumbnailPath || this.props.tx.thumbnailPath} />
              </Gradient>
            </View>
            <View style={[styles.dataArea]}>
              <View style={[styles.payeeNameArea]}>
                <View style={[styles.payeeNameWrap]}>
                  <TextInput
                    autoCapitalize='words'
                    onFocus={this.onFocusPayee}
                    autoCorrect={false}
                    style={[styles.payeeNameInput]}
                    placeholder='Payee'
                    defaultValue={this.state.name}
                    value={this.state.name}
                    placeholderTextColor={c.gray2}
                  />
                </View>
              </View>
              <View style={styles.payeeSeperator} />
              <View style={[styles.dateWrap]}>
                <T style={[styles.date]}>{this.state.dateTimeSyntax}</T>
              </View>
              <AmountAreaConnect
                onChangeNotesFxn={this.onChangeNotes}
                onChangeCategoryFxn={this.onChangeCategory}
                onChangeFiatFxn={this.onChangeFiat}
                onBlurFiatFxn={this.onBlurFiat}
                info={this.state}
                onPressFxn={this.onSaveTxDetails}
                fiatCurrencyCode={this.props.selectedWallet.fiatCurrencyCode}
                fiatCurrencySymbol={this.props.fiatSymbol}
                fiatAmount={this.state.amountFiat}
                onEnterSubcategories={this.onEnterSubcategories}
                subCategorySelectVisibility={this.state.subCategorySelectVisibility}
                categorySelectVisibility={this.state.categorySelectVisibility}
                onSelectSubCategory={this.onSelectSubCategory}
                subCategory={this.state.subCategory}
                type={type}
                selectCategory={this.onSelectCategory}
                onEnterCategories={this.onEnterCategories}
                onExitCategories={this.onExitCategories}
                usableHeight={this.props.usableHeight}
                onSubcategoryKeyboardReturn={this.onSubcategoriesKeyboardReturn}
                onNotesKeyboardReturn={this.onNotesKeyboardReturn}
                onFocusNotes={this.onFocusNotes}
                onBlurNotes={this.onBlurNotes}
                leftData={leftData}
                direction={this.state.direction}
                feeSyntax={feeSyntax}
                color={color}
                types={types}
                onFocusFiatAmount={this.onFocusFiatAmount}
                subcategoriesList={this.props.subcategoriesList}
                walletDefaultDenomProps={this.state.walletDefaultDenomProps}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }
}

const mapStateToProps = (state) => ({
  selectedWallet: UI_SELECTORS.getSelectedWallet(state),
  fiatSymbol: UTILS.getFiatSymbol(UI_SELECTORS.getSelectedWallet(state).fiatCurrencyCode),
  contacts: state.ui.contacts.contactList,
  usableHeight: platform.usableHeight,
  subcategoriesList: state.ui.scenes.transactionDetails.subcategories,
  settings: state.ui.settings
})
const mapDispatchToProps = (dispatch) => ({
  setTransactionDetails: (currencyCode, transactionDetails) => { dispatch(setTransactionDetails(currencyCode, transactionDetails)) }
})

export default connect(mapStateToProps, mapDispatchToProps)(TransactionDetails)

class AmountArea extends Component {
  constructor (props) {
    super(props)
    this.state = {
      color: ''
    }
  }

  render () {
    // console.log('rendering amountArea, this.props is: ', this.props, ' , and this.state is: ', this.state)
    let stepOne = UTILS.convertNativeToDisplay(this.props.walletDefaultDenomProps.multiplier)(this.props.info.tx.nativeAmount.replace('-', ''))

    let amountString = Math.abs(parseFloat(UTILS.truncateDecimals(stepOne, 6)))
    return (
      <View style={[styles.amountAreaContainer]}>
        <View style={[styles.amountAreaCryptoRow]}>
          <View style={[styles.amountAreaLeft]}>
            <T style={[styles.amountAreaLeftText, {color: this.props.leftData.color}]}>{sprintf(strings.enUS['fragment_transaction_' + this.props.direction + '_past'])}</T>
          </View>
          <View style={[styles.amountAreaMiddle]}>
            <View style={[styles.amountAreaMiddleTop]}>
              <T style={[styles.amountAreaMiddleTopText]}>{amountString}</T>
            </View>
            <View style={[styles.amountAreaMiddleBottom]}>
              <T style={[styles.amountAreaMiddleBottomText]}>{this.props.feeSyntax}</T>
            </View>
          </View>
          <View style={[styles.amountAreaRight]}>
            <T style={[styles.amountAreaRightText]}>{this.props.walletDefaultDenomProps.symbol}</T>
          </View>
        </View>
        <View style={[styles.editableFiatRow]}>
          <View style={[styles.editableFiatLeft]}>
            <T style={[styles.editableFiatLeftText]} />
          </View>
          <View style={[styles.editableFiatArea]}>
            <T style={styles.fiatSymbol}>{this.props.fiatCurrencySymbol}</T>
            <TextInput
              returnKeyType='done'
              autoCapitalize='none'
              autoCorrect={false}
              onFocus={this.props.onFocusFiatAmount}
              onChangeText={this.props.onChangeFiatFxn}
              style={[styles.editableFiat]}
              keyboardType='numeric'
              placeholder={''}
              value={UTILS.truncateDecimals(this.props.fiatAmount.toString().replace('-',''), 2, true)}
              defaultValue={''}
              onBlur={this.props.onBlurFiatFxn}
              blurOnSubmit={true}
            />
          </View>
          <View style={[styles.editableFiatRight]}>
            <T style={[styles.editableFiatRightText]}>{this.props.fiatCurrencyCode}</T>
          </View>
        </View>
        <View style={[styles.categoryRow]}>
          <TouchableOpacity style={[styles.categoryLeft, {borderColor: this.props.color}]} onPress={this.props.onEnterCategories} disabled={this.props.subCategorySelectVisibility}>
            <T style={[{color: this.props.color}, styles.categoryLeftText]}>{this.props.type.syntax}</T>
          </TouchableOpacity>
          <View style={[styles.categoryInputArea]}>
            <TextInput
              blurOnSubmit
              autoCapitalize='words'
              placeholderTextColor={c.gray2}
              onFocus={this.props.onEnterSubcategories}
              onChangeText={this.props.onChangeSubcategoryFxn}
              onSubmitEditing={this.props.onSubcategoryKeyboardReturn}
              style={[styles.categoryInput]}
              defaultValue={this.props.subCategory || ''}
              placeholder={sprintf(strings.enUS['transaction_details_category_title'])}
              autoCorrect={false}
            />
          </View>
        </View>
        <Modal isVisible={this.props.categorySelectVisibility} animationIn='slideInUp' animationOut='slideOutDown' backdropColor='black' backdropOpacity={0.6}>
          <Picker style={[ UTILS.border(),
            {
              backgroundColor: 'white',
              width: platform.deviceWidth,
              height: platform.deviceHeight / 3,
              position: 'absolute',
              top: (2/3) * platform.deviceHeight,
              left: -20
            }
          ]}
            itemStyle={{fontFamily: 'SourceSansPro-Black', color: c.gray1, fontSize: 30, paddingBottom: 14}}
            selectedValue={this.props.type.key}
            onValueChange={(itemValue) => this.props.selectCategory({itemValue})}>
            {categories.map((x) => (
              <Picker.Item label={this.props.types[x].syntax} value={x} key={this.props.types[x].key} />
            ))}
          </Picker>
        </Modal>
        <View style={[styles.notesRow]}>
          <View style={[styles.notesInputWrap]} >
            <TextInput
              onChangeText={this.props.onChangeNotesFxn}
              multiline
              numberOfLines={3}
              defaultValue={this.props.info.notes || ''}
              style={[styles.notesInput]}
              placeholderTextColor={c.gray2}
              placeholder={sprintf(strings.enUS['transaction_details_notes_title'])}
              autoCapitalize='sentences'
              autoCorrect={false}
              onFocus={this.props.onFocusNotes}
              onBlur={this.props.onBlurNotes}
              // onSubmitEditing={this.props.onBlurNotes}
              blurOnSubmit={false}
              onScroll={() => Keyboard.dismiss()}
            />
          </View>
        </View>
        <View style={[styles.footerArea]}>
          <View style={[styles.buttonArea]}>
            <PrimaryButton text={sprintf(strings.enUS['string_save'])} style={[styles.saveButton]} onPressFunction={this.props.onPressFxn} />
          </View>
          <TouchableWithoutFeedback onPress={() => this.props.dispatch(openHelpModal())} style={[styles.advancedTxArea]}>
            <T style={[styles.advancedTxText]}>{sprintf(strings.enUS['transaction_details_view_advanced_data'])}</T>
          </TouchableWithoutFeedback>
        </View>
      </View>
    )
  }
}
export const AmountAreaConnect = AmountArea

class SubCategorySelect extends Component {
  constructor (props) {
    super(props)
    this.state = {
      subcategories: this.props.subcategoriesList,
      filteredSubcategories: this.props.subcategoriesList.sort(),
      enteredSubcategory: this.props.enteredSubcategory
    }
    // this.props.usableHight = platform.usableHeight
  }

  render () {
    let filteredSubcats = (!this.props.enteredSubcategory) ? this.props.subcategoriesList : this.props.subcategoriesList.filter((entry) => entry.indexOf(this.props.enteredSubcategory) >= 0)
    let newPotentialSubCategories = []
    let newPotentialSubCategoriesFiltered = []
    if (this.props.enteredSubcategory) {
      newPotentialSubCategories = categories.map((cat) => cat.charAt(0).toUpperCase() + cat.slice(1) + ':' + this.props.enteredSubcategory)
      newPotentialSubCategoriesFiltered = newPotentialSubCategories.filter((cat) => this.props.subcategoriesList.indexOf(cat) < 0)
    }

    return (
      <SearchResults
        renderRegularResultFxn={this.renderSubcategory}
        onRegularSelectFxn={this.props.onPressFxn}
        regularArray={filteredSubcats.concat(newPotentialSubCategoriesFiltered)}
        usableHeight={this.props.usableHeight}
        style={[{width: platform.deviceWidth, height: platform.usableHeight}]}
        keyExtractor={this.keyExtractor}
        height={this.props.usableHeight - 51}
        extraTopSpace={0}
      />
    )
  }

  renderSubcategory (data, onRegularSelectFxn) {
    return (
      <TouchableHighlight delayPressIn={60} style={[styles.rowContainer]} underlayColor={c.gray4} onPress={() => (onRegularSelectFxn(data.item))}>
        <View style={[styles.rowContent]}>
          <View style={[styles.rowCategoryTextWrap]}>
            <T style={[styles.rowCategoryText]} numberOfLines={1}>{data.item}</T>
          </View>
          <View style={[styles.rowPlusWrap]}>
            <T style={[styles.rowPlus]}>+</T>
          </View>
        </View>
      </TouchableHighlight>
    )
  }

  keyExtractor = (item, index) => index
}

export const SubCategorySelectConnect = SubCategorySelect

class PayeeIcon extends Component {
  render () {
    return (
      <View style={[styles.modalHeaderIconWrapBottom]}>
        {this.renderIcon()}
      </View>
    )
  }

  renderIcon () {
    if (this.props.thumbnailPath) {
      return <Image source={{uri: this.props.thumbnailPath}} style={styles.payeeIcon} />
    } else {
      if (this.props.direction === 'receive') {
        return (
          <Image source={ReceivedIcon} style={styles.payeeIcon} />
        )
      } else {
        return (
          <Image source={SentIcon} style={styles.payeeIcon} />
        )
      }
    }
  }
}

class ContactSearchResults extends Component {

  render () {
    let filteredArray = this.props.contacts.filter((entry) => (entry.givenName + ' ' + entry.familyName).indexOf(this.props.currentPayeeText) >= 0)

    return (
      <SearchResults
        renderRegularResultFxn={this.renderResult}
        onRegularSelectFxn={this.props.onSelectPayee}
        regularArray={filteredArray}
        usableHeight={this.props.usableHeight}
        style={[{width: '100%', backgroundColor: 'white'}]}
        keyExtractor={this.keyExtractor}
        height={this.props.usableHeight - 32}
        extraTopSpace={-10}
      />
    )
  }

  renderResult = (data, onRegularSelectFxn) => {
    let fullName = data.item.familyName ? data.item.givenName + ' ' + data.item.familyName : data.item.givenName

    return (
      <View style={styles.singleContactWrap}>
        <TouchableHighlight onPress={() => onRegularSelectFxn(fullName, data.item.thumbnailPath)} underlayColor={c.gray4} style={[styles.singleContact]}>
          <View style={[styles.contactInfoWrap]}>
            <View style={styles.contactLeft}>
              <View style={[styles.contactLogo]} >
                {data.item.thumbnailPath ? (
                  <Image source={{uri: data.item.thumbnailPath}} style={{height: 40, width: 40, borderRadius: 20}} />
                ) : (
                  <Image source={ContactImage} style={{height: 40, width: 40, borderRadius: 20}} />
                )}

              </View>
              <View style={[styles.contactLeftTextWrap]}>
                <T style={[styles.contactName]}>{fullName}</T>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }

  keyExtractor = (item, index) => index
}
