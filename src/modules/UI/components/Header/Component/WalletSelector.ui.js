// @flow
import React, {Component} from 'react'
import {TouchableOpacity, View} from 'react-native'
import MDIcon from 'react-native-vector-icons/MaterialIcons'
import T from '../../FormattedText'
import WalletListModal from '../../WalletListModal/WalletListModalConnector'
import {border as b} from '../../../../utils'
import {sprintf} from 'sprintf-js'
import strings from '../../../../../locales/default'

import THEME from '../../../../../theme/variables/airbitz'
import * as Constants from '../../../../../constants/indexConstants'
import styles from '../style'
import type {
  GuiWallet
} from '../../../../../types'

const LOADING_TEXT = sprintf(strings.enUS['loading'])

type Props = {
  walletList: any,
  selectedWallet: GuiWallet,
  selectedWalletCurrencyCode: string,
  activeWalletIds: Array<string>,
  archivedWalletIds: Array<string>,
  toggleFunction: string,
  visibleFlag: string,
  scanToWalletListModalVisibility: boolean,
  selectedWalletListModalVisibility: boolean,
  addressModalVisible: boolean,
  toggleSelectedWalletListModal(): void,
  toggleScanToWalletListModal():void
}

export default class WalletSelector extends Component<Props> {
  _onPressToggleSelectedWalletModal = () => {
    this.props.toggleSelectedWalletListModal()
  }

  _onPressScanToDropdownToggle = () => {
    this.props.toggleScanToWalletListModal()
  }

  choseFunction () {
    return this.props.toggleFunction === '_onPressToggleSelectedWalletModal' ? this._onPressToggleSelectedWalletModal : this._onPressScanToDropdownToggle
  }

  render () {
    let topDisplacement = 66
    const headerText = this.props.selectedWallet
      ? this.props.selectedWallet.name + ':' + this.props.selectedWalletCurrencyCode
      : LOADING_TEXT

    return (
      <TouchableOpacity onPress={this.choseFunction()} style={[b(), {flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}]}>
        <View style={{height: 34, width: 34}} />
        <T style={{
          color: THEME.COLORS.WHITE, fontSize: 20
        }} numberOfLines={1}>
          {headerText}
        </T>
        <View style={[b(), {height: 34, width: 34, justifyContent: 'center', alignItems: 'center'}]}>
          <View style={[b(), {position: 'relative', top: 2}]}>
            {
              !this.props.scanToWalletListModalVisibility
              && !this.props.addressModalVisible
              && <MDIcon
                name='keyboard-arrow-down'
                style={styles.icon} />
            }
          </View>
        </View>
        {
          this.props[this.props.visibleFlag]
          && <WalletListModal
            topDisplacement={topDisplacement}
            type={Constants.FROM} />
        }
        {
          this.props.scanToWalletListModalVisibility
          && <WalletListModal
            topDisplacement={topDisplacement}
            type={Constants.TO} />
        }
      </TouchableOpacity>
    )
  }
}
