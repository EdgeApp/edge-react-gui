import React, {Component} from 'react'
import {TouchableOpacity, View} from 'react-native'
import {Title} from 'native-base'
import MDIcon from 'react-native-vector-icons/MaterialIcons'
import T from '../../FormattedText'
import {toggleSelectedWalletListModal, toggleScanToWalletListModal} from '../../WalletListModal/action'
import {WalletListModalConnect} from '../../WalletListModal/WalletListModal.ui'
import {connect} from 'react-redux'
import strings from '../../../../../locales/default'
import {sprintf} from 'sprintf-js'
import * as UI_SELECTORS from '../../../selectors.js'
import {border as b} from '../../../../utils'

class Body extends Component {
  render () {
    const scene = this.props.routes.scene
    const children = scene.children
    const sceneName = children ?
      this.props.routes.scene.children[this.props.routes.scene.index].name :
      null

    switch (sceneName) {
    case 'scan':
      return <ExampleFromWalletConnect walletList={this.props.walletList}
          toggleFunction='_onPressToggleSelectedWalletModal'
          visibleFlag='selectedWalletListModalVisibility' style={b()} />

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
  wallets: state.ui.wallets.byId,
  selectedWalletListModalVisibility: state.ui.scenes.scan.selectedWalletListModalVisibility,
  scanToWalletListModalVisibility: state.ui.scenes.scan.scanToWalletListModalVisibility
})
export default connect(mapStateToProps)(Body)

class DefaultHeader extends Component {
  _renderTitle = () => {
    const scene = this.props.routes.scene
    const children = scene.children
    const sceneIndex = scene.index
    const title = children ?
      this.props.routes.scene.children[sceneIndex].title :
      null

    return title || sprintf(strings.enUS['title_Header'])
  }

  render () {
    return <Title>{ sprintf('%s', strings.enUS['title_' + this._renderTitle().replace(/ /g, '_')]) }</Title>
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
    let topDisplacement = 66
    let selectionFunction = 'selectFromWallet'
    let walletNameString = this.props.selectedWallet.name + ':' + this.props.selectedWalletCurrencyCode

    return (
      <TouchableOpacity onPress={this[this.props.toggleFunction]} style={[b(), {flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}]}>
        <View style={{height: 34, width: 34}} />
        <T style={{color: '#FFF', fontSize: 20}} numberOfLines={1} >{walletNameString}</T>
        <View style={[b(), {height: 34, width: 34, justifyContent: 'center', alignItems: 'center'}]}>
          <View style={[b(), {position: 'relative', top: 2}]}>
            {!this.props.scanToWalletListModalVisibility && !this.props.addressModalVisible &&
              <MDIcon name='keyboard-arrow-down' style={{color: '#FFF', fontSize: 25}} />
            }
          </View>
        </View>
        {this.props[this.props.visibleFlag] && <WalletListModalConnect topDisplacement={topDisplacement} selectionFunction={selectionFunction} type='from' /> }
        {this.props.scanToWalletListModalVisibility && <WalletListModalConnect topDisplacement={topDisplacement} selectionFunction={'selectToWallet'} type='to' /> }
      </TouchableOpacity>
    )
  }
}

export const ExampleFromWalletConnect = connect(state => ({
  walletList: UI_SELECTORS.getWallets(state),

  selectedWallet: UI_SELECTORS.getSelectedWallet(state),
  selectedWalletCurrencyCode: UI_SELECTORS.getSelectedCurrencyCode(state),

  activeWalletIds: UI_SELECTORS.getActiveWalletIds(state),
  archivedWalletIds: UI_SELECTORS.getArchivedWalletIds(state),

  selectedWalletListModalVisibility: state.ui.scenes.scan.selectedWalletListModalVisibility,
  scanToWalletListModalVisibility: state.ui.scenes.scan.scanToWalletListModalVisibility
}))(ExampleFromWallet)
