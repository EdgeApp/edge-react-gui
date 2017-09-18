import React, {Component} from 'react'
import {
  Header as NBHeader,
  Left as NBLeft,
  Right as NBRight,
  Body as NBBody
} from 'native-base'
import LinearGradient from 'react-native-linear-gradient'

import Left from './Component/Left'
import Right from './Component/Right'
import Body from './Component/BodyConnector'

import styles from './style'
import {colors as c} from '../../../../theme/variables/airbitz'

export default class Header extends Component {
  _renderTitle = () => this.props.routes.scene.title || 'Header'

  _onLayout = (event) => {
    this.props.setHeaderHeight(event.nativeEvent.layout.height)
  }

  render () {
    return (
      <LinearGradient style={[styles.headerRoot]}
        start={{x: 0, y: 0}} end={{x: 1, y: 0}}
        colors={[c.gradient.light, c.gradient.dark]}
        onLayout={this._onLayout}>
        <NBHeader>
          <NBLeft style={{flex: 1}}>
            <Left routes={this.props.routes} />
          </NBLeft>
          <NBBody style={{flex: 3}}>
            <Body routes={this.props.routes} />
          </NBBody>
          <NBRight style={{flex: 1}}>
            <Right routes={this.props.routes} />
          </NBRight>
        </NBHeader>
        {this.props.children}
      </LinearGradient>
    )
  }
}
