import React, { Component } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import { openTransactionAlert, closeTransactionAlert } from './action.js'


class TransactionAlert extends Component {

  componentWillReceiveProps(nextProps){
    if(nextProps.view) {
      return this._openAlert(nextProps)
    }
    if(!nextProps.view) {
      return this._closeAlert()
    }
  }

  _openAlert = (props) => {
    return Alert.alert(
      'Transaction Received',
      props.message,
      [
        {text: 'Later', onPress: () => this._closeAlert(), style: 'cancel'},
        {text: 'Check Now', onPress: () => this._onPress(props)},
      ],
      {  onDismiss: () => { this._closeAlert() } }
    )
  }

  _closeAlert = () => {
    return this.props.dispatch(closeTransactionAlert())
  }

  _onPress = (props) => {
    console.log(props.route)
    return this._closeAlert()
  }

  render () {
    return null
  }
}

const mapStateToProps = state => ({
  view:    state.ui.scenes.transactionAlert.view,
  message: state.ui.scenes.transactionAlert.message,
  route:   state.ui.scenes.transactionAlert.route
})

export default connect(mapStateToProps)(TransactionAlert)
