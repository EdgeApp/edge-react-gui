import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
Header,
Left,
Right,
Body,
Icon
} from 'native-base'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'

import LeftComponent from './Component/Left.js'
import RightComponent from './Component/Right.js'
import BodyComponent from './Component/Body.js'
import {setHeaderHeight} from '../../dimensions/action'
import styles from './style'
import {colors as c} from '../../../../theme/variables/airbitz'

class HeaderUI extends Component {
  _renderTitle = () => {
    return this.props.routes.scene.title || 'Header'
  }

  _renderLeftButton = () => {
    if (this.props.routes.stackDepth) {
      return (
        <Icon name='arrow-back' onPress={e => Actions.pop()} />
      )
    }
  }

  _onLayout = (event) => {
    var {x, y, width, height} = event.nativeEvent.layout
    console.log('header event.nativeEvent is : ', event.nativeEvent)
    console.log('header onLayout occurred', x, y, width, height)
    this.props.dispatch(setHeaderHeight(height))
  }

  render () {
    return (
      <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} colors={[c.gradient.light, c.gradient.dark]} style={[styles.headerRoot]} onLayout={this._onLayout}>
        <Header>
          <Left style={{flex: 1}}>
            <LeftComponent routes={this.props.routes} />
          </Left>
          <Body style={{flex: 3}}>
            <BodyComponent routes={this.props.routes} />
          </Body>
          <Right style={{flex: 1}}>
            <RightComponent routes={this.props.routes} />
          </Right>
        </Header>
      </LinearGradient>
    )
  }
}

const mapStateToProps = state => ({
  routes: state.routes
})
export default connect(mapStateToProps)(HeaderUI)
