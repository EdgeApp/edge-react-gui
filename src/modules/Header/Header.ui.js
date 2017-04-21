import React, { Component } from 'react'
import { View, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { Header, Left, Title, Right, Body, Button } from 'native-base';
import LinearGradient from 'react-native-linear-gradient'

class HeaderUI extends Component {

  _renderTitle = () => {
    return this.props.routes.scene.title || 'Header'
  }

  render () {
    return (
      <LinearGradient start={{x:0,y:0}} end={{x:1, y:0}} colors={["#3b7adb","#2b569a"]}>
        <Header>
          <Left />
          <Body>
            <Title>{this._renderTitle()}</Title>
          </Body>
          <Right>
          </Right>
        </Header>
      </LinearGradient>
    )
  }

}

// const styles = StyleSheet.create({
//
//   container: {
//     backgroundColor:'#f2f2f2'
//   },
//
//   center: {
//     flex: 1,
//     fontSize: 16,
//     textAlign: 'center'
//   },
//
//   left: {
//     fontSize: 16,
//     paddingLeft: 15,
//     width: 50
//   },
//
//   right: {
//     fontSize: 16,
//     paddingRight: 15,
//     width: 50
//   },
//
// });
//


export default connect( state => ({

  routes: state.routes

}) )(HeaderUI)
