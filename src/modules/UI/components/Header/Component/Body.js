import React, { Component } from 'react'
import { Text, TouchableOpacity, View, TouchableHighlight } from 'react-native'
import { Icon, Title } from 'native-base'
import { Actions } from 'react-native-router-flux'
import Menu, { MenuOptions, MenuOption, MenuTrigger } from 'react-native-menu'
import { toggleSelectedWalletListModal, toggleScanToWalletListModal, toggleTransactionsWalletListModal} from '../../WalletListModal/action'

import {
  enableWalletListModalVisibility,
  disableWalletListModalVisibility
} from '../../WalletListModal/action'
import {WalletListModalConnect} from '../../WalletListModal/WalletListModal.ui'
import { connect } from 'react-redux'
//import ExampleToWallet from './ExampleToWallet.ui'
import strings from '../../../../../locales/default'
import {sprintf} from 'sprintf-js'
import * as UI_SELECTORS from '../../../selectors.js'
import {border as b} from '../../../../utils'

class Body extends Component {
  render () {
    switch(this.props.routes.scene.sceneKey) {
      case 'scan':
        return <ExampleFromWalletConnect walletList={this.props.walletList}
          toggleFunction='_onPressToggleSelectedWalletModal'
               visibleFlag='selectedWalletListModalVisibility' />

      case 'request':
        return <ExampleFromWalletConnect wallets={this.props.walletList}
          toggleFunction='_onPressToggleSelectedWalletModal'
               visibleFlag='selectedWalletListModalVisibility' />

      case 'transactionList':
        return <ExampleFromWalletConnect wallets={this.props.walletList}
          toggleFunction='_onPressToggleSelectedWalletModal'
               visibleFlag='selectedWalletListModalVisibility' />
      
      case 'sendConfirmation':
        return <ExampleFromWalletConnect wallets={this.props.walletList}
          toggleFunction='_onPressToggleSelectedWalletModal'
               visibleFlag='selectedWalletListModalVisibility' />
                     
      default:
        return <DefaultHeader routes={this.props.routes} />
    }
  }
}

const mapStateToProps = state => ({
  wallets:                           state.ui.wallets.byId,
  selectedWalletListModalVisibility: state.ui.scenes.scan.selectedWalletListModalVisibility,
  scanToWalletListModalVisibility:   state.ui.scenes.scan.scanToWalletListModalVisibility
})

export default connect((state) => (mapStateToProps))(Body)

class DefaultHeader extends Component {
  _renderTitle = () => {
    return this.props.routes.scene.title || sprintf(strings.enUS['title_Header'])
  }

  render () {
    return <Title>{ sprintf('%s', strings.enUS['title_'+ this._renderTitle().replace(/ /g,"_")]) }</Title>
  }
}

class ExampleFromWallet extends Component {

  _onPressToggleSelectedWalletModal = () => {
    console.log('inside onPressScanFromDropdownToggle')
    this.props.dispatch(toggleSelectedWalletListModal())
  }

  _onPressScanToDropdownToggle = () => {
    console.log('inside onPressScanToDropdownToggle')
    this.props.dispatch(toggleScanToWalletListModal())
  }

  render () {
    let topDisplacement =  66
    let selectionFunction = 'selectFromWallet'
    let walletNameString = (this.props.selectedWallet.name.length >= 12) ? (this.props.selectedWallet.name.slice(0,12) + '...') : this.props.selectedWallet.name

    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: "#FFF", fontSize: 20 }}>{walletNameString}</Text>

        <TouchableOpacity onPress={this[this.props.toggleFunction]} style={[b(),{height: 34, width: 34, justifyContent: 'center', alignItems: 'center'}]}>
          <View style={[b(), { position: 'relative', top: 2}]}>
            {!this.props.scanToWalletListModalVisibility && !this.props.addressModalVisible &&
              <Icon name="arrow-dropdown"  style={{ color: "#FFF", fontSize: 25}} />
            }
          </View>
        </TouchableOpacity>
        {this.props[this.props.visibleFlag] && <WalletListModalConnect topDisplacement={topDisplacement} selectionFunction={selectionFunction} type='from' /> }
        {this.props.scanToWalletListModalVisibility && <WalletListModalConnect topDisplacement={topDisplacement} selectionFunction={'selectToWallet'} type='to' /> }
      </View>
    )
  }
}

export const ExampleFromWalletConnect = connect(state => ({
  walletList:        state.ui.wallets.byId,
  selectedWalletId:  UI_SELECTORS.getSelectedWalletId(state),
  selectedWallet:    UI_SELECTORS.getSelectedWallet(state),
  activeWalletIds:   UI_SELECTORS.getActiveWalletIds(state),
  archivedWalletIds: UI_SELECTORS.getArchivedWalletIds(state),
  selectedWalletListModalVisibility: state.ui.scenes.scan.selectedWalletListModalVisibility,
  scanToWalletListModalVisibility:   state.ui.scenes.scan.scanToWalletListModalVisibility,
}))(ExampleFromWallet)
