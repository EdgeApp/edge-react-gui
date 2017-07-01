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
        <View style={styles.container}>
          <View>
            <LinearGradient start={{x:0,y:0}} end={{x:1, y:0}} style={[b(), styles.expandedHeader, b()]} colors={["#3b7adb","#2b569a"]}>
                <PayeeIcon direction={this.state.direction} />
            </LinearGradient>
          </View>
          <View style={styles.dataArea}>
            <View style={styles.payeeNameArea}>
              <View style={styles.payeeNameWrap}>
                <T style={styles.payeeNameText}>Glidera</T>
              </View>
              <View style={[b(), styles.dateWrap]}>
                <T style={[b(), styles.date]}>May 01, 2017 2:32:59 AM</T>
              </View>
              <AmountArea info={this.state} />
            </View>  
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
      <View style={styles.amountAreaContainer}>
        <View style={[styles.amountAreafiatRow]}>
          <View style={[styles.amountAreaLeft]}>
            <T></T>
          </View>
          <View style={[styles.amountAreaMiddle]}>
            <View style={[styles.amountAreaMiddleTop]}>
              <T></T>
            </View>
            <View style={[styles.amountAreaMiddleBottom]}>
              <T></T>
            </View>
          </View>
          <View style={[styles.amountAreaRight]}>
            <T>bits</T>
          </View>
        </View>
        <View style={[styles.editableFiatRow]}>
          <View style={[styles.editableFiatArea]}>
            <TextInput style={[styles.editableFiat]} />
          </View>
          <View style={[styles.editableFiatRight]}>
            <T>USD</T>
          </View>
        </View>
        <View style={[styles.categoryRow]}>
          <View style={[styles.categoryLeft]}></View>
          <View style={[styles.categoryInputArea]}>
            <TextInput placeholder='Monthly exchange' />
          </View>              
        </View>

        <View style={[styles.footerArea]}>
          <View style={[styles.buttonArea]}>
            <PrimaryButton />
          </View>
          <View>
            <T>View advanced transaction data</T>
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