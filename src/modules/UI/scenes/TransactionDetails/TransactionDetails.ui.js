import React, {Component} from 'react'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import {
  Image,
  TextInput,
  ScrollView,
  View,
  TouchableHighlight,
  Picker,
  TouchableOpacity,
  Keyboard
} from 'react-native'
import Modal from 'react-native-modal'
import Permissions from 'react-native-permissions'
import Contacts from 'react-native-contacts'
import {setContactList} from '../../contacts/action'
import ReceivedIcon from '../../../../assets/images/transactions/transaction-type-received.png'
import SentIcon from '../../../../assets/images/transactions/transaction-type-sent.png'
import ContactImage from '../../../../assets/images/contact.png'
import T from '../../components/FormattedText'
import {PrimaryButton} from '../../components/Buttons'
import {connect} from 'react-redux'
import LinearGradient from 'react-native-linear-gradient'
import {} from './action'
import styles from './style'
import {colors as c} from '../../../../theme/variables/airbitz'
import {border as b, limitFiatDecimals, getFiatSymbol} from '../../../utils'
import { setTransactionDetails } from './action.js'
import * as UI_SELECTORS from '../../selectors.js'
import { subcategories as subcats } from './subcategories.temp'
import SearchResults from '../../components/SearchResults'

const categories = ['income', 'expense', 'exchange', 'transfer']

class TransactionDetails extends Component {
  constructor (props) {
    super(props)
    const direction = (this.props.tx.amountSatoshi >= 0) ? 'receive' : 'send'
    const dateTime = new Date(this.props.tx.date * 1000)
    const dateString = dateTime.toLocaleDateString('en-US', {month: 'short', day: '2-digit', year: 'numeric'})
    const timeString = dateTime.toLocaleTimeString('en-US', {hour: 'numeric', minute: 'numeric', second: 'numeric'})
    this.state = {
      tx: this.props.tx,
      // payee: this.props.tx.metaData.payee ? this.props.tx.metaData.payee : '',
      direction,
      txid: this.props.tx.txid,
      payeeName: this.props.tx.payeeName, // remove commenting once metaData in Redux
      category: this.props.tx.metadata.category,
      notes: this.props.tx.metadata.notes,
      amountFiat: this.props.tx.metadata.amountFiat,
      bizId: this.props.tx.bizId || 12345,
      miscJson: this.props.tx.miscJson || null,
      dateTimeSyntax: dateString + ' ' + timeString,
      subCategorySelectVisibility: false,
      categorySelectVisibility: false,
      subCategory: this.props.tx.metadata.subcategory,
      contactSearchVisibility: false
    }
  }

  onFocusPayee = () => {
    console.log('onFocusPayee executing')
    this.setState({
      contactSearchVisibility: true
    })
    this.refs._scrollView.scrollTo({x: 0, y: 62, animated: true})
  }

  onBlurPayee = () => {
    console.log('onBlurPayee executing')
     /* this.setState({
      contactSearchVisibility: false

    }) */
    this.refs._scrollView.scrollTo({x: 0, y: 0, animated: true})
  }

  onChangePayee = (input) => {
    console.log('payeeName changed to: ', input)
    this.setState({
      payeeName: input
    })
  }

  onSelectPayee = (input) => {
    this.onChangePayee(input)
    this.onBlurPayee()
    this.refs._scrollView.scrollTo({x: 0, y: 0, animated: true})
  }

  onChangeFiat = (input) => {
    console.log('in onChangeFiat, input is: ', input, ' , and this.props.fiatSymbol is: ', this.props.fiatSymbol)
    this.setState({
      amountFiat: this.props.fiatSymbol + ' ' + limitFiatDecimals(input.replace(this.props.fiatSymbol, '').replace(' ', ''))
    })
  }

  onChangeCategory = (input) => {
    console.log('category changed to: ', input)
    this.setState({
      category: input
    })
  }

  onChangeSubcategory = (input) => {
    console.log('subcategory changed to: ', input)
    this.setState({
      subCategory: input
    })
  }

  onChangeNotes = (input) => {
    console.log('notes changed to: ', input)
    this.setState({
      notes: input
    })
  }

  onFocusNotes = (input) => {
    console.log('notes changed to: ', input)
    this.refs._scrollView.scrollTo({x: 0, y: 320, animated: true})
  }

  onBlurNotes = (input) => {
    console.log('notes changed to: ', input)
    Keyboard.dismiss()
    this.refs._scrollView.scrollTo({x: 0, y: 0, animated: true})
  }

  onEnterSubcategories = () => {
    console.log('setting subCategorySelectVisibility to true')
    this.setState({subCategorySelectVisibility: true})
    this.refs._scrollView.scrollTo({x: 0, y: 265, animated: true})
  }

  onExitSubcategories = () => {
    console.log('setting subCategorySelectVisibility to false')
    // this.setState({subCategorySelectVisibility: false})
  }

  onSubcategoriesKeyboardReturn = () => {
    this.setState({subCategorySelectVisibility: false})
    this.refs._scrollView.scrollTo({x: 0, y: 0, animated: true})
  }

  onSelectSubCategory = (input) => {
    console.log('subcategory selected as: ', input)
    let stringArray
    // check if there is a colon that delineates category and subcategory
    if (!input) {
      this.setState({
        subCategory: ''
      })
    } else {
      if (input.indexOf(':')) {
        stringArray = input.split(':')
        if (categories.indexOf(stringArray[0].toLowerCase())) {
          this.setState({
            category: stringArray[0].toLowerCase(),
            subCategory: stringArray[1]
          })
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
    this.setState({subCategorySelectVisibility: false})
    this.refs._scrollView.scrollTo({x: 0, y: 0, animated: true})
  }

  onEnterCategories = () => {
    console.log('setting categorySelectVisibility to true')
    this.setState({categorySelectVisibility: true})
  }

  onExitCategories = () => {
    console.log('setting scategorySelectVisibility to false')
    this.setState({categorySelectVisibility: false})
  }

  onSelectCategory = (item) => {
    console.log('onSelectCategory executing, item is: ', item)
    this.setState({category: item.itemValue})
    this.onExitCategories()
  }

  onPressSave = () => {
    console.log('onPressSave executing, this.state is: ', this.state)
    const { txid, payeeName, category, notes, amountFiat, bizId, miscJson } = this.state
    const transactionDetails = { txid, payeeName, category, notes, amountFiat, bizId, miscJson }
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

  render () {
    console.log('rendering Transaction Details scene, this.props is: ', this.props, ' and this.state is: ', this.state)
    return (
      <ScrollView ref='_scrollView' scrollEnabled={!this.state.subCategorySelectVisibility} overScrollMode='never' /* alwaysBounceVertical={false} */ bounces={false} >
        <View style={[b(), styles.container]}>
          <View>
            <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={[b(), styles.expandedHeader]} colors={[c.gradient.light, c.gradient.dark]}>
              <PayeeIcon direction={this.state.direction} thumbnailPath={this.props.tx.thumbnailPath} />
            </LinearGradient>
          </View>
          <View style={[styles.dataArea, b()]}>
            <View style={[styles.payeeNameArea, b()]}>
              <View style={[styles.payeeNameWrap, b()]}>
                <TextInput
                  blurOnSubmit
                  onSubmitEditing={this.onBlurPayee}
                  autoCapitalize='words'
                  onFocus={this.onFocusPayee}
                  autoCorrect={false}
                  onChangeText={this.onChangePayee}
                  style={[styles.payeeNameInput, b()]}
                  placeholder='Payee'
                  defaultValue={this.props.payeeName}
                  value={this.state.payeeName}
                />
              </View>
            </View>
            {this.state.contactSearchVisibility &&
              <ContactSearchResults
                onChangePayee={this.onSelectPayee}
                contacts={this.props.contacts}
                style={[{width: '100%'}, b()]}
                usableHeight={this.props.usableHeight}
                currentPayeeText={this.state.payeeName || ''}
                dimensions={this.props.dimensions}
                onSelectPayee={this.onSelectPayee}
            />
            }
            <View style={styles.payeeSeperator} />
            <View style={[styles.dateWrap]}>
              <T style={[styles.date]}>{this.state.dateTimeSyntax}</T>
            </View>
            <AmountAreaConnect
              onChangeNotesFxn={this.onChangeNotes}
              onChangeCategoryFxn={this.onChangeCategory}
              onChangeSubcategoryFxn={this.onChangeSubcategory}
              onChangeFiatFxn={this.onChangeFiat}
              info={this.state}
              onPressFxn={this.onPressSave}
              fiatCurrencyCode={this.props.selectedWallet.fiatCurrencyCode}
              fiatCurrencySymbol={this.props.fiatSymbol}
              fiatAmount={this.props.fiatSymbol + ' ' + limitFiatDecimals(this.state.amountFiat.toString().replace(this.props.fiatSymbol, '').replace(' ', ''))}
              onEnterSubcategories={this.onEnterSubcategories}
              onExitSubcategories={this.onExitSubcategories}
              subCategorySelectVisibility={this.state.subCategorySelectVisibility}
              categorySelectVisibility={this.state.categorySelectVisibility}
              onSelectSubCategory={this.onSelectSubCategory}
              subCategory={this.state.subCategory}
              category={this.state.category}
              selectCategory={this.onSelectCategory}
              onEnterCategories={this.onEnterCategories}
              onExitCategories={this.onExitCategories}
              usableHeight={this.props.usableHeight}
              onSubcategoryKeyboardReturn={this.onSubcategoriesKeyboardReturn}
              dimensions={this.props.dimensions}
              onFocusNotes={this.onFocusNotes}
              onBlurNotes={this.onBlurNotes}
            />
          </View>
        </View>
      </ScrollView>
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
  dimensions: state.ui.scenes.dimensions
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
    console.log('AmountArea, this.props is: ', this.props)
    let leftData, feeSyntax, currencySymbol, category
    currencySymbol = this.props.fiatCurrencySymbol

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

    if (!this.props.category) {
      if (this.props.info.direction === 'receive') {
        category = types.income
      } else {
        category = types.expense
      }
    } else {
      category = types[this.props.category]
    }

    if (this.props.info.direction === 'receive') {
      feeSyntax = ''
      leftData = { color: c.accentGreen, syntax: sprintf(strings.enUS['fragment_transaction_income']) }
    } else {
      feeSyntax = sprintf(strings.enUS['fragmet_tx_detail_mining_fee'], this.props.info.tx.networkFee)
      leftData = { color: c.accentRed, syntax: sprintf(strings.enUS['fragment_transaction_expense']) }
    }
    console.log('rendering AmountArea, category is: ', category, ' and categories is: ', categories)
    let color = category.color
    return (
      <View style={[styles.amountAreaContainer]}>
        <View style={[styles.amountAreaCryptoRow]}>
          <View style={[styles.amountAreaLeft]}>
            <T style={[styles.amountAreaLeftText, {color: leftData.color}]}>{sprintf(strings.enUS['fragment_transaction_' + this.props.info.direction])}</T>
          </View>
          <View style={[b(), styles.amountAreaMiddle]}>
            <View style={[b(), styles.amountAreaMiddleTop]}>
              <T style={[b(), styles.amountAreaMiddleTopText]}>{this.props.info.tx.amountSatoshi}</T>
            </View>
            <View style={[b(), styles.amountAreaMiddleBottom]}>
              <T style={[b(), styles.amountAreaMiddleBottomText]}>{feeSyntax}</T>
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
            <TextInput autoCapitalize='none' autoCorrect={false} onChangeText={this.props.onChangeFiatFxn} style={[b(), styles.editableFiat]} keyboardType='numeric' placeholder={currencySymbol + ' '} value={this.props.fiatAmount.toString()} defaultValue={currencySymbol + ' '} />
          </View>
          <View style={[styles.editableFiatRight]}>
            <T style={[styles.editableFiatRightText]}>{this.props.fiatCurrencyCode}</T>
          </View>
        </View>

        <View style={[styles.categoryRow, b()]}>
          <TouchableOpacity style={[styles.categoryLeft, {borderColor: color}]} onPress={this.props.onEnterCategories} disabled={this.props.subCategorySelectVisibility}>
            <T style={[{color: color}, styles.categoryLeftText]}>{category.syntax}</T>
          </TouchableOpacity>
          <View style={[b(), styles.categoryInputArea]}>
            <TextInput
              blurOnSubmit
              autoCapitalize='words'
              onBlur={this.props.onExitSubcategories}
              onFocus={this.props.onEnterSubcategories}
              onChangeText={this.props.onChangeSubcategoryFxn}
              style={[styles.categoryInput]}
              defaultValue={this.props.subCategory || ''}
              placeholder='Category'
              autoCorrect={false}
              onSubmitEditing={this.props.onSubcategoryKeyboardReturn}
            />
          </View>
        </View>
        {this.props.subCategorySelectVisibility &&
          <SubCategorySelectConnect
            onPressFxn={this.props.onSelectSubCategory}
            enteredSubcategory={this.props.subCategory}
            usableHeight={this.props.usableHeight}
            deviceDimensions={this.props.deviceDimensions}
          />
        }
        <Modal isVisible={this.props.categorySelectVisibility} animationIn='slideInUp' animationOut='slideOutDown' backdropColor='black' backdropOpacity={0.6}>
          <Picker style={[b(), {backgroundColor: 'white', width: this.props.dimensions.deviceDimensions.width, height: this.props.dimensions.deviceDimensions.height / 3, position: 'absolute', top: this.props.dimensions.deviceDimensions.height - this.props.dimensions.deviceDimensions.height / 3, left: -20}]}
            itemStyle={{fontFamily: 'SourceSansPro-Black', color: c.gray1, fontSize: 30, paddingBottom: 14}}
            selectedValue={category.key}
            onValueChange={(itemValue, itemIndex) => this.props.selectCategory({itemValue})}>
            {categories.map((x, i) => (
              <Picker.Item label={types[x].syntax} value={x} key={types[x].key} />
            ))}
          </Picker>
        </Modal>
        <View style={[styles.notesRow]}>
          <View style={[styles.notesInputWrap]} >
            <TextInput
              onChangeText={this.props.onChangeNotesFxn}
              numberOfLines={3} defaultValue={this.props.info.notes || ''}
              style={[styles.notesInput]} placeholderTextColor={'#CCCCCC'}
              placeholder='Notes'
              autoCapitalize='none'
              autoCorrect={false}
              onFocus={this.props.onFocusNotes}
              onBlur={this.props.onBlurNotes}
              onSubmitEditing={this.props.onBlurNotes}
            />
          </View>
        </View>
        <View style={[b(), styles.footerArea]}>
          <View style={[b(), styles.buttonArea]}>
            <PrimaryButton text={sprintf(strings.enUS['string_save'])} style={[b(), styles.saveButton]} onPressFunction={this.props.onPressFxn} />
          </View>
          <View style={[b(), styles.advancedTxArea]}>
            <T onPress={() => console.log('going to advanced Tx data')} style={[b(), styles.advancedTxText]}>View advanced transaction data</T>
          </View>
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
    this.state = {
      subcategories: subcats.sort(),
      filteredSubcategories: subcats.sort(),
      enteredSubcategory: this.props.enteredSubcategory
    }
    const dimensions = this.props.dimensions
    this.props.usableHight = dimensions.deviceDimensions.height - dimensions.headerHeight - dimensions.tabBarHeight
  }

  render () {
    let filteredSubcats = (!this.props.enteredSubcategory) ? this.state.subcategories : this.state.subcategories.filter((entry) => {
      return entry.indexOf(this.props.enteredSubcategory) >= 0
    })
    let newPotentialSubCategories = categories.map((cat) => {
      return cat.charAt(0).toUpperCase() + cat.slice(1) + ':' + this.props.enteredSubcategory
    })
    let newPotentialSubCategoriesFiltered = newPotentialSubCategories.filter((cat) => {
      return this.state.subcategories.indexOf(cat) < 0
    })
    console.log('about to render subcategorySelectArea, this.props is: ', this.props, ' , and this.state is: ', this.state)
    return (
      <SearchResults
        renderRegularResultFxn={this.renderPayee}
        onRegularSelectFxn={this.props.onPressFxn}
        regularArray={filteredSubcats.concat(newPotentialSubCategoriesFiltered)}
        usableHeight={this.props.usableHeight}
        style={[{width: this.props.dimensions.deviceDimensions.width, height: this.props.usableHeight}, b()]}
        keyExtractor={this.keyExtractor}
        dimensions={this.props.dimensions}
        height={this.props.usableHeight - 62}
        extraTopSpace={138}
      />
    )
  }

  renderPayee (data, onRegularSelectFxn) {
    console.log('about to renderPayee, data is: ', data, ' , and onRegularResultFxn is: ', onRegularSelectFxn)
    return (
      <TouchableHighlight delayPressIn={60} style={[styles.rowContainer]} underlayColor={'#eee'} onPress={() => (onRegularSelectFxn(data.item))}>
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
    console.log('rendering PayeeIcon, this.props is: ', this.props)
    return (
      <View style={[styles.modalHeaderIconWrapBottom]}>
        <View style={[styles.modalHeaderIconWrapTop, b()]}>
          {this.renderIcon()}
        </View>
      </View>
    )
  }

  renderIcon () {
    console.log('rendering txDetails icon, this.props is: ', this.props)
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
    console.log('rendeirng ContactSearchResults, this.props is: ', this.props)
    let filteredArray = this.props.contacts.filter((entry) => {
      return (entry.givenName + ' ' + entry.familyName).indexOf(this.props.currentPayeeText) >= 0
    })

    return (
      <SearchResults
        renderRegularResultFxn={this.renderResult}
        onRegularSelectFxn={this.props.onSelectPayee}
        regularArray={filteredArray}
        usableHeight={this.props.usableHeight}
        style={[{width: '100%'}, b()]}
        // style={[{width: this.props.dimensions.deviceDimensions.width, height: this.props.usableHeight}, b()]}
        keyExtractor={this.keyExtractor}
        dimensions={this.props.dimensions}
        height={this.props.usableHeight - 32}
        extraTopSpace={-32}
      />
    )
  }

  renderResult = (data, onRegularSelectFxn) => {
    console.log('rendering a result, data is: ', data, ' , and onRegularSelectFxn is: ', onRegularSelectFxn)
    let fullName = data.item.familyName ? data.item.givenName + ' ' + data.item.familyName : data.item.givenName

    return (
      <View style={styles.singleContactWrap}>
        <TouchableHighlight onPress={() => onRegularSelectFxn(fullName)} style={[styles.singleContact, b()]}>
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

/* class ContactIcon extends Component {
  constructor(props) {
    super(props)

  }

  render() {
    let iconBgColor = (this.props.direction === 'receive') ? c.accentGreen : c.accentRed
    return(
        <View style={[b(), styles.modalHeaderIconWrapBottom]}>
          <View style={styles.modalHeaderIconWrapTop}>
            {this.props.featuredIcon}
          </View>
        </View>
    )
  }
}
*/
