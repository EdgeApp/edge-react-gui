// @flow
import React, {Component} from 'react'
import {ScrollView} from 'react-native'
import styles from './style'
import * as Animatable from 'react-native-animatable'
import {border as b} from '../../../utils'
import WalletListModalBody from './components/WalletListModalBodyConnector'
import WalletListModalHeader from './components/WalletListModalHeaderConnector'
import platform from '../../../../theme/variables/platform.js'

type Props = {
  topDisplacement: number,
  type: string,
  whichWallet?: string,
  dropdownWalletListVisible: boolean,
  currentScene: string,
}
export default class WalletListModal extends Component<Props> {
  render () {
    const top = this.props.topDisplacement ? this.props.topDisplacement : 38
    return (
      <Animatable.View style={[b(), styles.topLevel, {position: 'absolute', top: top, height: (platform.deviceHeight - platform.toolbarHeight - platform.footerHeight)}]}
        animation='fadeInDown'
        duration={100} >
        <ScrollView>
          <WalletListModalHeader type={this.props.type} whichWallet={this.props.whichWallet} />
          <WalletListModalBody style={{flex: 1}}
            type={this.props.type}/>
        </ScrollView>
      </Animatable.View>
    )
  }
}

