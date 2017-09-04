import React, { Component } from 'react'
import { View } from 'react-native'
import { DefaultRenderer } from 'react-native-router-flux'

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
        <DefaultRenderer style={{flex: 1}} navigationState={children[0]} onNavigate={this.props.onNavigate} />
        <TabBar style={{flex: 1}} />
        <HelpModal style={{flex: 1}} />
        <ABAlert style={{flex: 1}} />
        <TransactionAlert style={{flex: 1}} />

      </View>
    )
  }
}


// Where you want to put navigation drawer
// render() {
//     return (
//         <Router
//             // then wrap your tabs scene with Drawer:
//             <Scene key="drawer" component={NavigationDrawer} open={false} >
//                 <Scene key="main" tabs={true} >
//                 ....
//             </Scene>
//         </Scene>
//     );
// }
