// @flow

import React, { Component } from 'react'
import { ScrollView } from 'react-native'
import * as Animatable from 'react-native-animatable'
import slowlog from 'react-native-slowlog'

import { PLATFORM } from '../../../../theme/variables/platform.js'
import { border as b } from '../../../utils'
import WalletListModalBody from './components/WalletListModalBodyConnector'
import WalletListModalHeader from './components/WalletListModalHeaderConnector'
import styles from './style'

type Props = {
  topDisplacement: number,
  type: string,
  whichWallet?: string,
  dropdownWalletListVisible: boolean,
  currentScene: string
}
export default class WalletListModal extends Component<Props> {
  constructor (props: any) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  render () {
    const top = this.props.topDisplacement ? this.props.topDisplacement : 38
    return (
      <Animatable.View style={[b(), styles.topLevel, { position: 'absolute', top: top, height: PLATFORM.usableHeight }]} animation="fadeInUp" duration={250}>
        <ScrollView>
          <WalletListModalHeader type={this.props.type} whichWallet={this.props.whichWallet} />
          <WalletListModalBody style={{ flex: 1 }} type={this.props.type} />
        </ScrollView>
      </Animatable.View>
    )
  }
}
