import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Text, Header, Left, Title, Right, Body, Button, Icon } from 'native-base';
import LinearGradient from 'react-native-linear-gradient'

class HeaderUI extends Component {

  _renderTitle = () => {
    return this.props.routes.scene.title || 'Header'
  }

  render () {
    return (
      <LinearGradient start={{x:0,y:0}} end={{x:1, y:0}} colors={["#3b7adb","#2b569a"]}>
        <Header>
          <Left>
            <Icon name='arrow-back' />
          </Left>
          <Body>
            <Title>{this._renderTitle()}</Title>
          </Body>
          <Right>
            <Text>Help</Text>
          </Right>
        </Header>
      </LinearGradient>
    )
  }
}

export default connect( state => ({

  routes: state.routes

}) )(HeaderUI)
