import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, Header, Left, Title, Right, Body, Button, Icon } from 'native-base';
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'

import LeftComponent from './Component/Left.js'
import RightComponent from './Component/Right.js'
import BodyComponent from './Component/Body.js'
import {setHeaderHeight} from '../../dimensions/action'

import styles from './style'

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


  _onLayout = (event) => {
    var {x, y, width, height} = event.nativeEvent.layout;
    console.log('onLayout occurred', x , y , width , height)
    this.props.dispatch(setHeaderHeight(height))
  }

  render () {
    return (
        <LinearGradient start={{x:0,y:0}} end={{x:1, y:0}} colors={["#3b7adb","#2b569a"]} style={[styles.headerRoot, {zIndex: 10}]}>
          <Header style={ {zIndex: 10}}>
            <Left>
              <LeftComponent routes={this.props.routes} />
            </Left>
            <Body onLayout={this._onLayout}>
              <BodyComponent routes={this.props.routes} />
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
