import React, {Component} from 'react'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import PropTypes from 'prop-types'
import {
  Easing,
  TextInput,
  Image,
  ScrollView,
  ListView,
  Text,
  View,
  StyleSheet,
  TouchableHighlight,
  Animated,
  ActivityIndicator
} from 'react-native'
import T from '../../components/FormattedText'
import {PrimaryButton} from '../../components/Buttons'
import {connect} from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import Ionicon from 'react-native-vector-icons/Ionicons'
import LinearGradient from 'react-native-linear-gradient'
import {Actions} from 'react-native-router-flux'
import {} from './action'
import Contacts from 'react-native-contacts'
import styles from './style'
import {border as b} from '../../../utils'
import { setTransactionDetails } from './action.js'

const monthNames = [
  sprintf(strings.enUS['transactions_list_date_jan']),
  sprintf(strings.enUS['transactions_list_date_feb']),
  sprintf(strings.enUS['transactions_list_date_mar']),
  sprintf(strings.enUS['transactions_list_date_apr']),
  sprintf(strings.enUS['transactions_list_date_may']),
  sprintf(strings.enUS['transactions_list_date_jun']),
  sprintf(strings.enUS['transactions_list_date_jul']),
  sprintf(strings.enUS['transactions_list_date_aug']),
  sprintf(strings.enUS['transactions_list_date_sep']),
  sprintf(strings.enUS['transactions_list_date_oct']),
  sprintf(strings.enUS['transactions_list_date_nov']),
  sprintf(strings.enUS['transactions_list_date_dec'])
]
var dateStrings = []

class TransactionDetails extends Component {
   constructor(props) {
     super(props)
     console.log('Constructor of TransactionDetails, this.props is: ', this.props)
     const direction = (this.props.tx.amountSatoshi >= 0) ? 'receive' : 'send'     
     this.state = {
        tx: this.props.tx,
        //payee: this.props.tx.metaData.payee ? this.props.tx.metaData.payee : '', 
        direction: direction,
     }
   }

  contactSearch (nameKey, myArray) {
    for (var i = 0; i < myArray.length; i++) {
      if (myArray[i].givenName === nameKey) {
        return myArray[i]
      }
    }
  }

  onPressSave = () => {
    const { txid, payeeName, category, notes, amountFiat, bizId, miscJson } = this.state
    const transactionDetails = { txid, payeeName, category, notes, amountFiat, bizId, miscJson }
    dispatch(this.props.setTransactionDetails(transactionDetails))
  }

  render () {
    console.log('rendering Transaction Details scene, this.props is: ', this.props)
    return (
        <View style={[b(), styles.container]}>
          <View>
            <LinearGradient start={{x:0,y:0}} end={{x:1, y:0}} style={[b(), styles.expandedHeader, b()]} colors={["#3b7adb","#2b569a"]}>
                <PayeeIcon direction={this.state.direction} />
            </LinearGradient>
          </View>
          <View style={[styles.dataArea]}>
            <View style={[styles.payeeNameArea]}>
              <View style={[styles.payeeNameWrap]}>
                <T style={[styles.payeeNameText]}>Glidera</T>
              </View>
              <View style={[styles.dateWrap]}>
                <T style={[styles.date]}>May 01, 2017 2:32:59 AM</T>
              </View>
            </View>  
            <AmountArea info={this.state} />            
          </View>        
        </View>

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
  constructor(props){
    super(props)
  }
  // fiat amount is editable

  render() {
    return(
      <View style={[b(), styles.amountAreaContainer]}>
        <View style={[b(), styles.amountAreaCryptoRow]}>
          <View style={[b(), styles.amountAreaLeft]}>
            <T style={[b(), styles.amountAreaLeftText, {color: (this.props.info.direction === 'receive') ? '#7FC343' : '#4977BB'}]}>Received</T>
          </View>
          <View style={[b(), styles.amountAreaMiddle]}>
            <View style={[b(), styles.amountAreaMiddleTop]}>
              <T style={[styles.amountAreaMiddleTopText]}>b 23489723</T>
            </View>
            <View style={[b(), styles.amountAreaMiddleBottom]}>
              <T style={[styles.amountAreaMiddleBottomText]}>(+ 0.19 Fee)</T>
            </View>
          </View>
          <View style={[b(), styles.amountAreaRight]}>
            <T style={[styles.amountAreaRightText]}>bits</T>
          </View>
        </View>
        <View style={[b(), styles.editableFiatRow]}>
          <View style={[b(), styles.editableFiatArea]}>
            <TextInput style={[b(), styles.editableFiat]} />
          </View>
          <View style={[b(), styles.editableFiatRight]}>
            <T style={[styles.editableFiatRightText]}>USD</T>
          </View>
        </View>

        <View style={[b(), styles.categoryRow]}>
          <View style={[b(), styles.categoryLeft]}></View>
          <View style={[b(), styles.categoryInputArea]}>
            <TextInput placeholder='Monthly exchange' />
          </View>              
        </View>

        <View style={[b(), styles.footerArea]}>
          <View style={[b(), styles.buttonArea]}>
            <PrimaryButton />
          </View>
          <View style={[b(), styles.advancedTxArea]}>
            <T style={[b(), styles.advancedTxText]}>View advanced transaction data</T>
          </View>
        </View>
      </View>
    )
  }
}

class PayeeIcon extends Component {
  constructor(props) {
    super(props)

  }

  render() {
    console.log('rendering PayeeIcon, this.props is: ', this.props)
    let iconBgColor = (this.props.direction === 'receive') ? '#7FC343' : '#4977BB'    
    return(
        <View style={[styles.modalHeaderIconWrapBottom, {backgroundColor: iconBgColor}]}>
            <View style={[styles.modalHeaderIconWrapTop, b('purple')]}>
              {this.renderIcon()}
            </View>
        </View>
    )
  }

  renderIcon() {
    console.log('rendering txDetails icon, this.props is: ', this.props)
    let iconBgColor = (this.props.direction === 'receive') ? '#7FC343' : '#4977BB'    
    if (this.props.direction === 'receive'){
      return(
        <Ionicon name="ios-arrow-round-down" color={iconBgColor} size={44} style={[styles.payeeIcon]} />
      )
    } else {
      return(
        <Ionicon name="ios-arrow-round-up" color={iconBgColor} size={44} style={[ styles.payeeIcon]} />
      )
    }
  }
}


class ContactIcon extends Component {
  constructor(props) {
    super(props)

  }

  render() {
    let iconBgColor = (this.props.direction === 'receive') ? 'green' : 'red'
    return(
        <View style={[b(), styles.modalHeaderIconWrapBottom]}>
          <View style={styles.modalHeaderIconWrapTop}>
            {this.props.featuredIcon}
          </View>
        </View>
    )
  }
}