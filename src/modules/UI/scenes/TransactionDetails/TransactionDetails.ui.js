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
     const direction = (this.props.tx.amount >= 0) ? 'receive' : 'send'     
     this.state = {
        tx: this.props.tx,
        //payee: this.props.tx.metaData.payee ? this.props.tx.metaData.payee : '', 
        direction: direction
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
          <LinearGradient start={{x:0,y:0}} end={{x:1, y:0}} style={[styles.expandedHeader, b()]} colors={["#3b7adb","#2b569a"]}>
              <PayeeIcon direction={this.state.direction} />
          </LinearGradient>
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

class PayeeIcon extends Component {
  constructor(props) {
    super(props)
    if (this.props.direction === 'receive'){
      this.props.iconBgColor = 'green'
      this.props.payeeIcon = <Ionicon name="ios-arrow-round-down" color={this.props.iconBgColor} size={24} />
    } else {
      this.props.iconBgColor = 'red'
      this.props.payeeIcon = <Ionicon name="ios-arrow-round-up" color={this.props.iconBgColor} size={24} />
    }
  }

  render() {
    let iconBgColor = (this.props.direction === 'receive') ? 'green' : 'red'
    return(
        <View style={[styles.modalHeaderIconWrapBottom, {backgroundColor: this.props.iconBgColor}]}>
          <View>
            <View style={styles.modalHeaderIconWrapTop}>
              {this.props.payeeIcon}
            </View>
          </View>
          <View>
            <TextInput multiline={true} editable={true} numberOfLines={4} />
          </View>
        </View>
    )
  }
}


class ContactIcon extends Component {
  constructor(props) {
    super(props)

  }

  render() {
    let iconBgColor = (this.props.direction === 'receive') ? 'green' : 'red'
    return(
        <View style={[styles.modalHeaderIconWrapBottom]}>
          <View style={styles.modalHeaderIconWrapTop}>
            {this.props.featuredIcon}
          </View>
        </View>
    )
  }
}