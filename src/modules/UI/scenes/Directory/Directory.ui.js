import React, {Component} from 'react'
import {Text, TouchableOpacity} from 'react-native'
import {Content} from 'native-base'
import {connect} from 'react-redux'
import {openTransactionAlert} from '../../components/TransactionAlert/action.js'

class Directory extends Component {

  render () {
    return (
      <Content>
        <TouchableOpacity onPress={() => this.props.dispatch(openTransactionAlert('Changed of message', 1234))}>
          <Text style={{color: 'black', fontSize: 50}}>
          Directory Page
        </Text>
        </TouchableOpacity>
      </Content>
    )
  }
}

export default connect()(Directory)
