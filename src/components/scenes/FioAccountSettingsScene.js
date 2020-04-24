// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ScrollView, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings'
import { findWalletByFioAddress, getRenewalFee } from '../../modules/FioAddress/util'
import T from '../../modules/UI/components/FormattedText/index'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import { styles } from '../../styles/scenes/FioAccountSettingsStyle'
import FullScreenLoader from '../common/FullScreenLoader'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'

export type State = {
  fioWallet: EdgeCurrencyWallet | null,
  feeLoading: boolean,
  renewalFee: number | null
}
export type StateProps = {
  fioWallets: EdgeCurrencyWallet[]
}
export type NavigationProps = {
  fioAddressName: string
}

type Props = NavigationProps & StateProps

export class FioAccountSettingsScene extends Component<Props, State> {
  state: State = {
    fioWallet: null,
    feeLoading: false,
    renewalFee: null
  }
  componentDidMount (): void {
    this.setFees()
  }

  setFees = async (): Promise<void> => {
    const { fioWallets, fioAddressName } = this.props
    this.setState({ feeLoading: true })
    const fioWallet = await findWalletByFioAddress(fioWallets, fioAddressName)
    let renewalFee = null
    if (fioWallet) {
      try {
        renewalFee = await getRenewalFee(fioWallet)
      } catch (e) {
        showError(e.message)
      }
    }
    this.setState({ fioWallet, renewalFee, feeLoading: false })
  }

  showRenew = (): void => {
    const { fioAddressName } = this.props
    const { fioWallet, renewalFee } = this.state
    if (!fioWallet) {
      showError(s.strings.fio_get_wallet_err_msg)
    }
    if (renewalFee === null) {
      showError(s.strings.fio_get_fee_err_msg)
    }
    if (renewalFee !== null && fioWallet) {
      Actions[Constants.FIO_RENEW_ADDRESS]({ fioWallet, fioAddressName, fee: renewalFee })
    }
  }

  render () {
    const { fioAddressName } = this.props
    const { feeLoading } = this.state

    return (
      <SceneWrapper background="body">
        {feeLoading ? <FullScreenLoader /> : null}
        <ScrollView style={styles.list}>
          <TouchableHighlight onPress={this.showRenew}>
            <View style={styles.item}>
              <View style={styles.info}>
                <T style={styles.infoTitle}>
                  {s.strings.fio_renew_label} {fioAddressName}
                </T>
              </View>
              <View style={styles.arrow}>
                <Icon type={Constants.FONT_AWESOME} name={Constants.ANGLE_RIGHT} size={30} />
              </View>
            </View>
          </TouchableHighlight>
        </ScrollView>
      </SceneWrapper>
    )
  }
}
