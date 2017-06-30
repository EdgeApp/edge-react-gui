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
const tx = {
  payee: 'Glidera',
  date: new Date(),
  amount: 100,
  currency: 'TRD'
}

class TransactionDetails extends Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  contactSearch (nameKey, myArray) {
    for (var i = 0; i < myArray.length; i++) {
      if (myArray[i].givenName === nameKey) {
        return myArray[i]
      }
    }
  }

  onPressSave = () => {
    const {
      txid
      payeeName,
      category,
      notes,
      amountFiat,
      bizId,
      miscJson
    } = this.state

    const transactionDetails = {
      txid,
      payeeName,
      category,
      notes,
      amountFiat,
      bizId,
      miscJson
    }
    dispatch(this.props.setTransactionDetails(transactionDetails))
  }

  render () {
    console.log('rendering Transaction Details scene, this.props is: ', this.props)
    return (
      <View>
        <T>Hello</T>
        <T>Selected Wallet ID is: {this.props.walletId}</T>
        <T>Selected Transaction ID is: {this.props.txId}</T>
      </View>

    )
  }
}

TransactionDetails.propTypes = {}

const mapStateToProps = state => ({})
const mapDispatchToProps = dispatch => ({
  setTransactionDetails: (transactionDetails) => { dispatch(setTransactionDetails(transactionDetails)) }
})

export default connect(mapStateToProps, mapDispatchToProps)(TransactionDetails)
