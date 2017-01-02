import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import { BackAndroid, View, Text, Button } from 'react-native'
import style from '../Style'

import { fadeWhiteOverlay } from '../Landing.action'

class Home extends Component {
  componentDidMount = () => {
    let self = this
    BackAndroid.addEventListener('hardwareBackPress', function () {
      self.handleBack()
    })
  }
  handleBack = () => {
    let self = this
    self.props.dispatch(fadeWhiteOverlay())
    Actions.landing()
  }

  render () {
    return (
      <View style={style.container} >
        <View style={style.form}>
          <Text style={{fontSize: 40}}>Home Page</Text>
          <Button style={{flex: 1}} onPress={this.handleBack} title='Log Out'>Log Out</Button>
        </View>
      </View>
    )
  }

}

export default connect(state => ({
  user: state.user
}))(Home)
