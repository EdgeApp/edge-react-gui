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
import LinearGradient from 'react-native-linear-gradient'
import styles from './style'
import {colors as c} from '../../../../theme/variables/airbitz'
import {border as b, limitFiatDecimals, getFiatSymbol} from '../../../utils'
import {
  setTransactionDetails,
  setNewSubcategory,
  getSubcategories
  // setSubcategories,
  // setSubcategoriesRequest
} from './action.js'
import * as UI_SELECTORS from '../../selectors.js'
import SearchResults from '../../components/SearchResults'
import { openHelpModal } from '../../components/HelpModal/actions'

const categories = ['income', 'expense', 'exchange', 'transfer']

class TransactionDetails extends Component {
  constructor (props) {
    super(props)
    console.log('inside txDetails constructor, this.props is: ', this.props)
    const direction = (this.props.tx.amountSatoshi >= 0) ? 'receive' : 'send'
    const dateTime = new Date(this.props.tx.date * 1000)
    const dateString = dateTime.toLocaleDateString('en-US', {month: 'short', day: '2-digit', year: 'numeric'})
    const timeString = dateTime.toLocaleTimeString('en-US', {hour: 'numeric', minute: 'numeric', second: 'numeric'})
    this.state = {
      tx: this.props.tx,
      // payee: this.props.tx.metaData.payee ? this.props.tx.metaData.payee : '',
      direction,
      txid: this.props.tx.txid,
      name: this.props.tx.metadata.name, // remove commenting once metaData in Redux
      thumbnailPath: this.props.thumbnailPath,
      category: this.props.tx.metadata.category,
      notes: this.props.tx.metadata.notes,
      amountFiat: this.props.tx.metadata.amountFiat,
      bizId: 0,
      miscJson: this.props.tx.miscJson || null,
      dateTimeSyntax: dateString + ' ' + timeString,
      subCategorySelectVisibility: false,
      categorySelectVisibility: false,
      subCategory: this.props.tx.metadata.subcategory,
      contactSearchVisibility: false,
      animation: new Animated.Value(0),
      payeeOpacity: new Animated.Value(0),
      subcategoryOpacity: new Animated.Value(0),
      payeeZIndex: 0,
      subcatZIndex: 0
    }
  }

  onSaveTxDetails = () => {
    this.props.dispatch(setTransactionDetails(this.props.selectedWallet, this.state, this.props.currencyCode))
  }

  onFocusPayee = () => {
    this._togglePayeeVisibility()
    this.refs._scrollView.scrollTo({x: 0, y: 62, animated: true})
    this.payeeTextInput.focus()
  }

  onBlurPayee = () => {
    this._togglePayeeVisibility()
    Keyboard.dismiss()
    this.refs._scrollView.scrollTo({x: 0, y: 0, animated: true})
  }

  onChangePayee = (contactName, thumbnailPath) => {
    console.log('changing payee, contactName is: ', contactName, ' , and thumbnailPath is: ', thumbnailPath)
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
    this.setState({
      amountFiat: this.props.fiatSymbol + ' ' + limitFiatDecimals(input.replace(this.props.fiatSymbol, '').replace(' ', ''))
    })
  }

  onChangeCategory = (input) => {
    this.setState({
      category: input
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
    console.log('in onChangeNotes')
  }

  onFocusNotes = (input) => {
    this.refs._scrollView.scrollTo({x: 0, y: 300, animated: true})
  }

  onBlurNotes = (input) => {
    console.log('executing onBlurNotes')
    Keyboard.dismiss()
    this.refs._scrollView.scrollTo({x: 0, y: 0, animated: true})
  }

  onNotesKeyboardReturn = () => {
    console.log('in onNotesKeyboardReturn')
    this.onBlurNotes()
  }

  onEnterSubcategories = () => {
    console.log('in onEnterSubcategories, this is: ', this)
    this.refs._scrollView.scrollTo({x: 0, y: 260, animated: true})
    this._toggleSubcategoryVisibility()
    this.subcategoryTextInput.focus()
  }

  onExitSubcategories = () => {
    console.log('in onExitSubcategories, this is: ', this)
    // this._toggleSubcategoryVisibility()
  }

  onSubcategoriesKeyboardReturn = () => {
    console.log('in onSubcategoriesKeyboardReturn, this is: ', this)
    this._toggleSubcategoryVisibility()
    this.refs._scrollView.scrollTo({x: 0, y: 0, animated: true})
  }

  onSelectSubCategory = (input) => {
    console.log('in onSelectSubCategory, this is: ', this, ' , and input is: ', input)
    let stringArray
    // check if there is a colon that delineates category and subcategory
    if (!input) {
      this.setState({
        subCategory: ''
      })
    } else {
      if (input.indexOf(':')) {
        stringArray = input.split(':')
        if (categories.indexOf(stringArray[0].toLowerCase()) >= 0) {
          this.setState({
            category: stringArray[0].toLowerCase(),
            subCategory: stringArray[1]
          })
          if (this.props.subcategoriesList.indexOf(input) === -1) { // if this is a new subcategory
            this.addNewSubcategory(input)
          }
        } else {
          this.setState({
            subCategory: input
          })
        }
      } else {
        this.setState({
          subCategory: input
        })
      }
    }
    console.log('in end of onSelectSubCategory, this is: ', this)
    this._toggleSubcategoryVisibility()
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

  onSelectCategory = (item) => {
    this.setState({category: item.itemValue})
    this.onExitCategories()
  }

  onFocusFiatAmount = () => {
    this.refs._scrollView.scrollTo({x: 0, y: 90, animated: true})
  }

  onPressSave = () => {
    const { txid, name, category, notes, amountFiat, bizId, miscJson } = this.state
    const transactionDetails = { txid, name, category, notes, amountFiat, bizId, miscJson }
    console.log('transactionDetails are: ', transactionDetails)
    this.props.setTransactionDetails(transactionDetails)
  }

  componentDidMount () {
    const permissionStatus = ['authorized', 'undetermined']
    if (!this.props.contacts) {
      Permissions.getPermissionStatus('contacts').then((response) => {
        if (permissionStatus.indexOf(response)) {
          Contacts.getAll((err, contacts) => {
            if (err === 'denied') {
              // error
            } else {
              console.log('all contacts: ', contacts)
              contacts.sort((a, b) => {
                return a.givenName > b.givenName
              })
              this.props.dispatch(setContactList(contacts))
            }
          })
        }
      })
    }
  }

  _togglePayeeVisibility = () => {
    let toOpacity
    if (!this.state.contactSearchVisibility) {
      toOpacity = 1
      this.setState({contactSearchVisibility: true, payeeZIndex: 99999}, () => {
        console.log('in _togglePayeeVisibility, this is: ', this)
        Animated.timing(
          this.state.payeeOpacity,
          {
            toValue: toOpacity,
            easing: Easing.ease,
            duration: 300,
            delay: 300
          }
          ).start()
      }
      )
    } else {
      this.state.payeeOpacity.setValue(0)
      this.setState({
        contactSearchVisibility: false,
        payeeZIndex: 0
      })
    }
  }

  _toggleSubcategoryVisibility = () => {
    let toOpacity
    if (!this.state.subCategorySelectVisibility) {
      toOpacity = 1
      this.setState({subCategorySelectVisibility: true, subcatZIndex: 99999}, () => {
        console.log('in _toggleSubcategoryVisibility, this is: ', this)
        Animated.timing(
          this.state.subcategoryOpacity,
          {
            toValue: toOpacity,
            easing: Easing.ease,
            duration: 300,
            delay: 300
          }
        ).start()
      }
      )
    } else {
      this.state.subcategoryOpacity.setValue(0)
      this.setState({
        subCategorySelectVisibility: false,
        subcatZIndex: 0
      })
    }
  }

  componentWillMount () {
    console.log('TransactionDetails.ui.js getSubcategories is: ', getSubcategories())
    this.props.dispatch(getSubcategories())
  }

  render () {
    let leftData, feeSyntax, category

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

    if (!this.state.category) {
      if (this.state.direction === 'receive') {
        category = types.income
      } else {
        category = types.expense
      }
    } else {
      category = types[this.state.category]
    }

    if (this.state.direction === 'receive') {
      feeSyntax = ''
      leftData = { color: c.accentGreen, syntax: sprintf(strings.enUS['fragment_transaction_income']) }
    } else {
      feeSyntax = sprintf(strings.enUS['fragmet_tx_detail_mining_fee'], this.props.info.tx.networkFee)
      leftData = { color: c.accentRed, syntax: sprintf(strings.enUS['fragment_transaction_expense']) }
    }
    let color = category.color
    console.log('rendering txDetails, this is: ', this)
    return (
      <View style={[b()]}>
        <Animated.View
          style={[b(), {opacity: this.state.payeeOpacity, width: '100%', zIndex: this.state.payeeZIndex, backgroundColor: 'white', position: 'absolute', top: 4, height: this.props.usableHeight}]}
          >
          <View style={[styles.payeeNameArea, b()]}>
            <View style={[styles.payeeNameWrap]}>
              <TextInput
                ref={(component) => { this.payeeTextInput = component }}
                blurOnSubmit
                onSubmitEditing={this.onBlurPayee}
                autoCapitalize='words'
                autoCorrect={false}
                onChangeText={this.onChangePayee}
                style={[styles.payeeNameInput, b()]}
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
            style={[{width: '100%'}, b()]}
            usableHeight={this.props.usableHeight}
            currentPayeeText={this.state.name || ''}
            dimensions={this.props.dimensions}
            onSelectPayee={this.onSelectPayee}
            blurOnSubmit
            onBlur={this.onBlurPayee}
          />
        </Animated.View>
        <Animated.View
          style={[b(), {opacity: this.state.subcategoryOpacity, width: '100%', zIndex: this.state.subcatZIndex, backgroundColor: 'white', position: 'absolute', height: this.props.usableHeight}]}
          >
          <View style={[styles.modalCategoryRow, b()]}>
            <TouchableOpacity style={[b(), styles.categoryLeft, {borderColor: color}]} disabled>
              <T style={[b(), {color: color}, styles.categoryLeftText]}>{category.syntax}</T>
            </TouchableOpacity>
            <View style={[b(), styles.modalCategoryInputArea]}>
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
            deviceDimensions={this.props.dimensions}
            subcategoriesList={this.props.subcategoriesList}
          />
        </Animated.View>
        <ScrollView keyboardShouldPersistTaps='handled' style={b()} ref='_scrollView' scrollEnabled={!this.state.subCategorySelectVisibility} overScrollMode='never' /* alwaysBounceVertical={false} */ bounces={false} >
          <View style={[b(), styles.container]}>
            <View>
              <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={[b(), styles.expandedHeader]} colors={[c.gradient.light, c.gradient.dark]}>
                <PayeeIcon direction={this.state.direction} thumbnailPath={this.state.thumbnailPath || this.props.tx.thumbnailPath} />
              </LinearGradient>
            </View>
            <View style={[styles.dataArea, b()]}>
              <View style={[styles.payeeNameArea, b()]}>
                <View style={[styles.payeeNameWrap, b()]}>
                  <TextInput
                    autoCapitalize='words'
                    onFocus={this.onFocusPayee}
                    autoCorrect={false}
                    style={[styles.payeeNameInput, b()]}
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
                info={this.state}
                onPressFxn={this.onSaveTxDetails}
                fiatCurrencyCode={this.props.selectedWallet.fiatCurrencyCode}
                fiatCurrencySymbol={this.props.fiatSymbol}
                fiatAmount={this.props.fiatSymbol + ' ' + limitFiatDecimals(this.state.amountFiat.toString().replace(this.props.fiatSymbol, '').replace(' ', ''))}
                onEnterSubcategories={this.onEnterSubcategories}
                subCategorySelectVisibility={this.state.subCategorySelectVisibility}
                categorySelectVisibility={this.state.categorySelectVisibility}
                onSelectSubCategory={this.onSelectSubCategory}
                subCategory={this.state.subCategory}
                category={category}
                selectCategory={this.onSelectCategory}
                onEnterCategories={this.onEnterCategories}
                onExitCategories={this.onExitCategories}
                usableHeight={this.props.usableHeight}
                onSubcategoryKeyboardReturn={this.onSubcategoriesKeyboardReturn}
                dimensions={this.props.dimensions}
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
              />
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }
}

TransactionDetails.propTypes = {
}

const mapStateToProps = state => ({
  selectedWallet: UI_SELECTORS.getSelectedWallet(state),
  fiatSymbol: getFiatSymbol(UI_SELECTORS.getSelectedWallet(state).fiatCurrencyCode),
  contacts: state.ui.contacts.contactList,
  usableHeight: state.ui.scenes.dimensions.deviceDimensions.height - state.ui.scenes.dimensions.headerHeight - state.ui.scenes.dimensions.tabBarHeight,
  dimensions: state.ui.scenes.dimensions,
  subcategoriesList: state.ui.scenes.transactionDetails.subcategories.sort()
})
const mapDispatchToProps = dispatch => ({
  setTransactionDetails: (transactionDetails) => { dispatch(setTransactionDetails(transactionDetails)) }
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
    console.log('rendering amountArea, this.props is: ', this.props, ' , and this.state is: ', this.state)
    return (
      <View style={[b(), styles.amountAreaContainer]}>
        <View style={[b(), styles.amountAreaCryptoRow]}>
          <View style={[b(), styles.amountAreaLeft]}>
            <T style={[b(), styles.amountAreaLeftText, {color: this.props.leftData.color}]}>{sprintf(strings.enUS['fragment_transaction_' + this.props.direction + '_past'])}</T>
          </View>
          <View style={[b(), styles.amountAreaMiddle]}>
            <View style={[b(), styles.amountAreaMiddleTop]}>
              <T style={[b(), styles.amountAreaMiddleTopText]}>{this.props.info.tx.amountSatoshi}</T>
            </View>
            <View style={[b(), styles.amountAreaMiddleBottom]}>
              <T style={[b(), styles.amountAreaMiddleBottomText]}>{this.props.feeSyntax}</T>
            </View>
          </View>
          <View style={[b(), styles.amountAreaRight]}>
            <T style={[b(), styles.amountAreaRightText]}>bits</T>
          </View>
        </View>
        <View style={[b(), styles.editableFiatRow]}>
          <View style={[b(), styles.editableFiatLeft]}>
            <T style={[b(), styles.editableFiatLeftText]} />
          </View>
          <View style={[b(), styles.editableFiatArea]}>
            <TextInput
              returnKeyType='done'
              autoCapitalize='none'
              autoCorrect={false}
              onFocus={this.props.onFocusFiatAmount}
              onChangeText={this.props.onChangeFiatFxn}
              style={[b(), styles.editableFiat]}
              keyboardType='numeric'
              placeholder={this.props.fiatCurrencySymbol + ' '}
              value={this.props.fiatAmount.toString()}
              defaultValue={this.props.fiatCurrencySymbol + ' '}
            />
          </View>
          <View style={[styles.editableFiatRight]}>
            <T style={[styles.editableFiatRightText]}>{this.props.fiatCurrencyCode}</T>
          </View>
        </View>
        <View style={[styles.categoryRow, b()]}>
          <TouchableOpacity style={[b(), styles.categoryLeft, {borderColor: this.props.color}]} onPress={this.props.onEnterCategories} disabled={this.props.subCategorySelectVisibility}>
            <T style={[b(), {color: this.props.color}, styles.categoryLeftText]}>{this.props.category.syntax}</T>
          </TouchableOpacity>
          <View style={[b(), styles.categoryInputArea]}>
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
          <Picker style={[b(), {backgroundColor: 'white', width: this.props.dimensions.deviceDimensions.width, height: this.props.dimensions.deviceDimensions.height / 3, position: 'absolute', top: this.props.dimensions.deviceDimensions.height - this.props.dimensions.deviceDimensions.height / 3, left: -20}]}
            itemStyle={{fontFamily: 'SourceSansPro-Black', color: c.gray1, fontSize: 30, paddingBottom: 14}}
            selectedValue={this.props.category.key}
            onValueChange={(itemValue, itemIndex) => this.props.selectCategory({itemValue})}>
            {categories.map((x, i) => (
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
        <View style={[b(), styles.footerArea]}>
          <View style={[b(), styles.buttonArea]}>
            <PrimaryButton text={sprintf(strings.enUS['string_save'])} style={[b(), styles.saveButton]} onPressFunction={this.props.onPressFxn} />
          </View>
          <TouchableWithoutFeedback onPress={() => this.props.dispatch(openHelpModal())} style={[b(), styles.advancedTxArea]}>
            <T style={[b(), styles.advancedTxText]}>{sprintf(strings.enUS['transaction_details_view_advanced_data'])}</T>
          </TouchableWithoutFeedback>
        </View>
      </View>
    )
  }
}
export const AmountAreaConnect = connect(state => ({
  dimensions: state.ui.scenes.dimensions
}))(AmountArea)

class SubCategorySelect extends Component {
  constructor (props) {
    super(props)
    console.log('in SubCategorySelect constructor, this.props.subcategoriesList is: ', this.props.subcategoriesList)
    this.state = {
      subcategories: this.props.subcategoriesList,
      filteredSubcategories: this.props.subcategoriesList.sort(),
      enteredSubcategory: this.props.enteredSubcategory
    }
    // const dimensions = this.props.dimensions
    // this.props.usableHight = dimensions.deviceDimensions.height - dimensions.headerHeight - dimensions.tabBarHeight
  }

  render () {
    console.log('in SubCategorySelect rendering, this is: ', this)
    let filteredSubcats = (!this.props.enteredSubcategory) ? this.props.subcategoriesList : this.props.subcategoriesList.filter((entry) => {
      return entry.indexOf(this.props.enteredSubcategory) >= 0
    })
    let newPotentialSubCategories = []
    let newPotentialSubCategoriesFiltered = []
    if (this.props.enteredSubcategory) {
      categories.map((cat) => {
        return cat.charAt(0).toUpperCase() + cat.slice(1) + ':' + this.props.enteredSubcategory
      })
      newPotentialSubCategoriesFiltered = newPotentialSubCategories.filter((cat) => {
        return this.props.subcategoriesList.indexOf(cat) < 0
      })
    }

    console.log('rendering SubcategorySelect, filteredSubcats is: ', filteredSubcats, ' , newPotentialSubcategories is: ', newPotentialSubCategories, ' , and newPotentialSubcategoriesFiltered: ', newPotentialSubCategoriesFiltered)
    return (
      <SearchResults
        renderRegularResultFxn={this.renderSubcategory}
        onRegularSelectFxn={this.props.onPressFxn}
        regularArray={filteredSubcats.concat(newPotentialSubCategoriesFiltered)}
        usableHeight={this.props.usableHeight}
        style={[{width: this.props.dimensions.deviceDimensions.width, height: this.props.usableHeight}, b()]}
        keyExtractor={this.keyExtractor}
        dimensions={this.props.dimensions}
        height={this.props.usableHeight - 51}
        extraTopSpace={-13}
      />
    )
  }

  renderSubcategory (data, onRegularSelectFxn) {
    return (
      <TouchableHighlight delayPressIn={60} style={[styles.rowContainer]} underlayColor={c.gray4} onPress={() => (onRegularSelectFxn(data.item))}>
        <View style={[styles.rowContent]}>
          <View style={[b(), styles.rowCategoryTextWrap]}>
            <T style={[b(), styles.rowCategoryText]} numberOfLines={1}>{data.item}</T>
          </View>
          <View style={[styles.rowPlusWrap]}>
            <T style={[styles.rowPlus]}>+</T>
          </View>
        </View>
      </TouchableHighlight>
    )
  }

  keyExtractor = (item, index) => {
    return index
  }
}
SubCategorySelect.propTypes = {

}

export const SubCategorySelectConnect = connect(state => ({
  dimensions: state.ui.scenes.dimensions
}))(SubCategorySelect)

class PayeeIcon extends Component {
  render () {
    return (
      <View style={[b(), styles.modalHeaderIconWrapBottom]}>
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
    let filteredArray = this.props.contacts.filter((entry) => {
      return (entry.givenName + ' ' + entry.familyName).indexOf(this.props.currentPayeeText) >= 0
    })

    return (
      <SearchResults
        renderRegularResultFxn={this.renderResult}
        onRegularSelectFxn={this.props.onSelectPayee}
        regularArray={filteredArray}
        usableHeight={this.props.usableHeight}
        style={[{width: '100%', backgroundColor: 'white'}, b()]}
        // style={[{width: this.props.dimensions.deviceDimensions.width, height: this.props.usableHeight}, b()]}
        keyExtractor={this.keyExtractor}
        dimensions={this.props.dimensions}
        height={this.props.usableHeight - 32}
        extraTopSpace={-32}
      />
    )
  }

  renderResult = (data, onRegularSelectFxn) => {
    let fullName = data.item.familyName ? data.item.givenName + ' ' + data.item.familyName : data.item.givenName

    return (
      <View style={styles.singleContactWrap}>
        <TouchableHighlight onPress={() => onRegularSelectFxn(fullName, data.item.thumbnailPath)} underlayColor={c.gray4} style={[styles.singleContact, b()]}>
          <View style={[styles.contactInfoWrap, b()]}>
            <View style={styles.contactLeft}>
              <View style={[styles.contactLogo, b()]} >
                {data.item.thumbnailPath ? (
                  <Image source={{uri: data.item.thumbnailPath}} style={{height: 40, width: 40, borderRadius: 20}} />
                ) : (
                  <Image source={ContactImage} style={{height: 40, width: 40, borderRadius: 20}} />
                )}

              </View>
              <View style={[styles.contactLeftTextWrap, b()]}>
                <T style={[styles.contactName]}>{fullName}</T>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }

  keyExtractor = (item, index) => {
    return index
  }
}
