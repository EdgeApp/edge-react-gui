import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Text, Header, Left, Title, Right, Body, Button, Icon } from 'native-base';
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'

import LeftComponent from './Component/Left.js'
import RightComponent from './Component/Right.js'

class HeaderUI extends Component {

  _renderTitle = () => {
    return this.props.routes.scene.title || 'Header'
  }

  _renderLeftButton = () => {
    if(this.props.routes.stackDepth) {
      return (
        <Icon name='arrow-back' onPress={ e => Actions.pop() } />
      )
    }
  }

  render () {
    return (
      <LinearGradient start={{x:0,y:0}} end={{x:1, y:0}} colors={["#3b7adb","#2b569a"]}>
        <Header>
          <Left>
            <LeftComponent routes={this.props.routes} />
          </Left>
          <Body>
            <Title>{this._renderTitle()}</Title>
          </Body>
          <Right>
            <RightComponent routes={this.props.routes} />
          </Right>
        </Header>
      </LinearGradient>
    )
  }
}

export default connect( state => ({

  routes: state.routes

}) )(HeaderUI)
