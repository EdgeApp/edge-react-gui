import React, {Component} from 'react'
import {
  Header as NBHeader,
  Left as NBLeft,
  Right as NBRight,
  Body as NBBody
} from 'native-base'
import Gradient from '../Gradient/Gradient.ui'

import Left from './Component/Left'
import Right from './Component/Right'
import Body from './Component/BodyConnector'

import styles from './style'

export default class Header extends Component {
  _renderTitle = () => this.props.routes.scene.title || 'Header'

  _onLayout = (event) => {
    this.props.setHeaderHeight(event.nativeEvent.layout.height)
  }

  render () {
    return (
      <Gradient style={[styles.headerRoot]} onLayout={this._onLayout}>
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
      </Gradient>
    )
  }
}
