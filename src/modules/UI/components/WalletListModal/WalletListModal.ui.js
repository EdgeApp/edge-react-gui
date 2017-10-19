// @flow
import React, {Component} from 'react'
import {ScrollView} from 'react-native'
import PropTypes from 'prop-types'
import styles from './style'
import * as Animatable from 'react-native-animatable'
import {border as b} from '../../../utils'
import WalletListModalBody from './components/WalletListModalBodyConnector'
import WalletListModalHeader from './components/WalletListModalHeaderConnector'
import platform from '../../../../theme/variables/platform.js'

export default class WalletListModal extends Component<any> {
  constructor (props: any) {
    super(props)
    if (!this.props.topDisplacement) {
      this.props.topDisplacement = 68
    }
  }

  render () {
    return (
      <Animatable.View style={[b(), styles.topLevel, {position: 'absolute', top: 38, height: (platform.deviceHeight - platform.toolbarHeight - platform.footerHeight)}]}
        animation='fadeInDown'
        duration={100} >
        <ScrollView>
          <WalletListModalHeader type={this.props.type} />
          <WalletListModalBody style={{flex: 1}}
            onPress={this.props.onPress} />
        </ScrollView>
      </Animatable.View>
    )
  }
}

WalletListModal.propTypes = {
  dropdownWalletListVisible: PropTypes.bool,
  currentScene: PropTypes.string
}
