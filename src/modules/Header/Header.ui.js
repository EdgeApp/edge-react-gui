import React, { Component } from 'react'
import { View, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
// import { Header, Body, Right, Left, Title } from 'native-base'
import { Header, Left, Title, Right, Body, Button } from 'native-base';

class HeaderUI extends Component {

  _renderTitle = () => {
    return this.props.routes.scene.title || 'header'
  }

  render () {
    return (
      <Header>
        <Left />
        <Body>
          <Title style={{textAlign: 'center'}}>{this._renderTitle()}</Title>
        </Body>
        <Right>
        </Right>
      </Header>
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
