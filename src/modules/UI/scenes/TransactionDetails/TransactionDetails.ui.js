import React, {Component} from 'react'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import {
  Image,
  TextInput,
  ScrollView,
  View
} from 'react-native'
import ReceivedIcon from '../../../../assets/images/transactions/transaction-type-received.png'
import SentIcon from '../../../../assets/images/transactions/transaction-type-sent.png'
import T from '../../components/FormattedText'
import {PrimaryButton} from '../../components/Buttons'
import {connect} from 'react-redux'
import LinearGradient from 'react-native-linear-gradient'
import {} from './action'
import styles from './style'
import {border as b} from '../../../utils'
import { setTransactionDetails } from './action.js'

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
      category: this.props.tx.category,
      notes: this.props.tx.notes,
      amountFiat: this.props.tx.amountFiat || '3.56',
      bizId: this.props.tx.bizId || 12345,
      miscJson: this.props.tx.miscJson || null,
      dateTimeSyntax: dateString + ' ' + timeString
    }
  }

  contactSearch (nameKey, myArray) {
    for (var i = 0; i < myArray.length; i++) {
      if (myArray[i].givenName === nameKey) {
        return myArray[i]
      }
    }
  }

  onChangePayee = (input) => {
    console.log('payeeName changed to: ', input)
    this.setState({
      payeeName: input
    })
  }

  onChangeFiat = (input) => {
    console.log('amountFiat changed to: ', input)
    this.setState({
      amountFiat: input
    })
  }

  onChangeCategory = (input) => {
    console.log('category changed to: ', input)
    this.setState({
      category: input
    })
  }

  onChangeNotes = (input) => {
    console.log('notes changed to: ', input)
    this.setState({
      notes: input
    })
  }

  onPressSave = () => {
    console.log('onPressSave executing, this.state is: ', this.state)
    const { txid, payeeName, category, notes, amountFiat, bizId, miscJson } = this.state
    const transactionDetails = { txid, payeeName, category, notes, amountFiat, bizId, miscJson }
    console.log('transactionDetails are: ', transactionDetails)
    this.props.setTransactionDetails(transactionDetails)
  }

  render () {
    console.log('rendering Transaction Details scene, this.props is: ', this.props, ' and this.state is: ', this.state)
    return (
      <ScrollView overScrollMode='never' /* alwaysBounceVertical={false} */ bounces={false} >
        <View style={[b(), styles.container]}>
          <View>
            <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={[b(), styles.expandedHeader, b()]} colors={['#3b7adb', '#2b569a']}>
              <PayeeIcon direction={this.state.direction} />
            </LinearGradient>
          </View>
          <View style={[styles.dataArea]}>
            <View style={[styles.payeeNameArea]}>
              <View style={[styles.payeeNameWrap, b()]}>
                <TextInput autoCapitalize='none' autoCorrect={false} onChangeText={this.onChangePayee} style={[styles.payeeNameInput, b()]} placeholder='Payee' defaultValue={this.props.payeeName} />
              </View>
              <View style={styles.payeeSeperator} />
              <View style={[styles.dateWrap]}>
                <T style={[styles.date]}>{this.state.dateTimeSyntax}</T>
              </View>
            </View>
            <AmountArea
              onChangeNotesFxn={this.onChangeNotes}
              onChangeCategoryFxn={this.onChangeCategory}
              onChangeFiatFxn={this.onChangeFiat}
              info={this.state} onPressFxn={this.onPressSave} />
          </View>
        </View>
      </ScrollView>
    )
  }
}

TransactionDetails.propTypes = {
}

const mapStateToProps = state => ({})
const mapDispatchToProps = dispatch => ({
  setTransactionDetails: (transactionDetails) => { dispatch(setTransactionDetails(transactionDetails)) }
})

export default connect(mapStateToProps, mapDispatchToProps)(TransactionDetails)

class AmountArea extends Component {
  // fiat amount is editable
  types = {
    exchange: {
      color: '#F6A623',
      syntax: 'Exchange'
    },
    expense: {
      color: '#4977BB',
      syntax: 'Expense'
    },
    transfer: {
      color: 'blue',
      syntax: 'Transfer'
    },
    receive: {
      color: '#7FC343',
      syntax: 'Income'
    }
  }

  render () {
    console.log('rendering AmountArea, this.props is: ', this.props)
    return (
      <View style={[styles.amountAreaContainer]}>
        <View style={[styles.amountAreaCryptoRow]}>
          <View style={[styles.amountAreaLeft]}>
            <T style={[styles.amountAreaLeftText, {color: (this.props.info.tx.direction === 'receive') ? '#7FC343' : '#4977BB'}]}>Received</T>
          </View>
          <View style={[styles.amountAreaMiddle]}>
            <View style={[styles.amountAreaMiddleTop]}>
              <T style={[styles.amountAreaMiddleTopText]}>{this.props.info.tx.amountSatoshi}</T>
            </View>
            <View style={[styles.amountAreaMiddleBottom]}>
              <T style={[styles.amountAreaMiddleBottomText]}>{sprintf(strings.enUS['fragmet_tx_detail_mining_fee'], this.props.info.tx.networkFee)}</T>
            </View>
          </View>
          <View style={[styles.amountAreaRight]}>
            <T style={[styles.amountAreaRightText]}>bits</T>
          </View>
        </View>
        <View style={[styles.editableFiatRow]}>
          <View style={[styles.editableFiatLeft]}>
            <T style={[styles.editableFiatLeftText]} />
          </View>
          <View style={[styles.editableFiatArea]}>
            <TextInput autoCapitalize='none' autoCorrect={false} onChangeText={this.props.onChangeFiatFxn} style={[styles.editableFiat]} keyboardType='numeric' placeholder={'Notes'} defaultValue={this.props.info.amountFiat || ''} />
          </View>
          <View style={[styles.editableFiatRight]}>
            <T style={[styles.editableFiatRightText]}>USD</T>
          </View>
        </View>

        <View style={[styles.categoryRow]}>
          <View style={[b(), styles.categoryLeft, {borderColor: this.types[this.props.info.direction].color}]}>
            <T style={[styles.categoryLeftText, {color: this.types[this.props.info.direction].color}]}>{this.props.info.direction}</T>
          </View>
          <View style={[b(), styles.categoryInputArea]}>
            <TextInput onChangeText={this.props.onChangeCategoryFxn} style={[b(), styles.categoryInput]} defaultValue={this.props.info.category || ''} placeholder='Category' autoCapitalize='none' autoCorrect={false} />
          </View>
        </View>
        <View style={[styles.notesRow]}>
          <View style={[styles.notesInputWrap]} >
            <TextInput onChangeText={this.props.onChangeNotesFxn} numberOfLines={3} defaultValue={this.props.info.notes || ''} style={[styles.notesInput]} placeholderTextColor={'#CCCCCC'} placeholder='Notes' autoCapitalize='none' autoCorrect={false} />
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
