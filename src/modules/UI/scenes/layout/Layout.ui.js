import React, { Component } from 'react'
import { View } from 'react-native'
import { DefaultRenderer } from 'react-native-router-flux'

import SideMenu from '../../components/SideMenu/SideMenu.ui'
import Header from '../../components/Header/Header.ui'
import TabBar from '../../components/TabBar/TabBar.ui'
import HelpModal from '../../components/HelpModal'
import ABAlert from '../../components/ABAlert'
import TransactionAlert from '../../components/TransactionAlert'

export default class Layout extends Component {
  render () {
    const state = this.props.navigationState
    const children = state.children

    return (
      <View style={{flex: 1}}>
        <Header routes={this.props.routes} />
        <SideMenu>
          <DefaultRenderer style={{flex: 1}} navigationState={children[0]} onNavigate={this.props.onNavigate} />
        </SideMenu>
        <HelpModal style={{flex: 1}} />
        <ABAlert style={{flex: 1}} />
        <TransactionAlert style={{flex: 1}} />
        <TabBar style={{flex: 1}} />
      </View>
    )
  }
}
