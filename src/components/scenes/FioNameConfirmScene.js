// @flow

import { type EdgeCurrencyConfig, type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { FIO_ADDRESS_REGISTER_SELECT_WALLET, FIO_ADDRESS_REGISTER_SUCCESS, WALLET_LIST } from '../../constants/SceneKeys.js'
import { CURRENCY_PLUGIN_NAMES, FIO_ADDRESS_DELIMITER } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { FioActionSubmit } from '../../modules/FioAddress/components/FioActionSubmit'
import { connect } from '../../types/reactRedux.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles } from '../services/ThemeContext.js'
import { SceneHeader } from '../themed/SceneHeader'
import { Tile } from '../themed/Tile'

type StateProps = {
  fioPlugin?: EdgeCurrencyConfig,
  isConnected: boolean
}

type NavigationProps = {
  fioName: string,
  paymentWallet: EdgeCurrencyWallet,
  fee: number,
  ownerPublicKey: string
}

type Props = NavigationProps & StateProps

const ONE_FREE_ADDRESS_PER_DOMAIN_ERROR = 'ONE_FREE_ADDRESS_PER_DOMAIN_ERROR'

class FioNameConfirm extends React.PureComponent<Props> {
  isFioAddress = () => {
    const { fioName } = this.props
    return fioName.indexOf(FIO_ADDRESS_DELIMITER) > -1
  }

  getFee = async () => {
    return this.props.fee
  }

  saveFioName = async () => {
    const { isConnected, fioName, paymentWallet, fioPlugin, ownerPublicKey, fee } = this.props
    if (!isConnected) {
      throw new Error(s.strings.fio_network_alert_text)
    }

    if (!fee) {
      if (this.isFioAddress()) {
        if (!fioPlugin) {
          throw new Error(s.strings.fio_register_address_err_msg)
        }
        const response = await fioPlugin.otherMethods.buyAddressRequest(
          {
            address: fioName,
            referralCode: fioPlugin.currencyInfo.defaultSettings.defaultRef,
            publicKey: ownerPublicKey
          },
          true
        )
        if (response.error) {
          if (response.errorCode && response.errorCode === ONE_FREE_ADDRESS_PER_DOMAIN_ERROR && response.code === 400) {
            const publicDomains = await fioPlugin.otherMethods.getDomains(fioPlugin.currencyInfo.defaultSettings.fallbackRef)
            const domainExists = publicDomains.find(domain => domain.domain === fioName.split(FIO_ADDRESS_DELIMITER)[1])
            if (domainExists && !domainExists.free) {
              await Airship.show(bridge => (
                <ButtonsModal
                  bridge={bridge}
                  title={s.strings.fio_address_register_pay_title}
                  message={s.strings.fio_address_register_pay}
                  buttons={{
                    ok: { label: s.strings.string_ok_cap }
                  }}
                />
              ))
              return Actions.push(FIO_ADDRESS_REGISTER_SELECT_WALLET, {
                fioAddress: fioName,
                selectedWallet: paymentWallet,
                selectedDomain: {
                  name: domainExists.domain,
                  expiration: new Date().toDateString(),
                  isPublic: true,
                  walletId: '',
                  isFree: domainExists.free
                },
                isFallback: true
              })
            }
          }
          throw new Error(response.error)
        }

        await Airship.show(bridge => (
          <ButtonsModal
            bridge={bridge}
            title={`${s.strings.fio_address_register_form_field_label} ${s.strings.fragment_wallet_unconfirmed}`}
            message={s.strings.fio_address_register_pending_free}
            buttons={{
              ok: { label: s.strings.string_ok_cap }
            }}
          />
        ))
        Actions.jump(WALLET_LIST)
      } else {
        // no free domains
        showError(s.strings.fio_get_fee_err_msg)
      }
    } else {
      try {
        if (this.isFioAddress()) {
          const { expiration, feeCollected } = await paymentWallet.otherMethods.fioAction('registerFioAddress', { fioAddress: fioName, ownerPublicKey })
          window.requestAnimationFrame(() =>
            Actions.push(FIO_ADDRESS_REGISTER_SUCCESS, {
              fioName,
              expiration,
              feeCollected
            })
          )
        } else {
          const { expiration, feeCollected } = await paymentWallet.otherMethods.fioAction('registerFioDomain', {
            fio_domain: fioName,
            max_fee: fee,
            owner_fio_public_key: ownerPublicKey
          })
          window.requestAnimationFrame(() =>
            Actions.push(FIO_ADDRESS_REGISTER_SUCCESS, {
              fioName,
              expiration,
              feeCollected
            })
          )
        }
      } catch (e) {
        showError(s.strings.fio_register_address_err_msg)
      }
    }
  }

  render() {
    const { fioName, paymentWallet } = this.props
    const styles = getStyles()

    return (
      <SceneWrapper background="theme">
        <View style={styles.scene}>
          <SceneHeader title={this.isFioAddress() ? s.strings.title_fio_address_confirmation : s.strings.title_register_fio_domain} underline />
          <Tile
            type="static"
            title={this.isFioAddress() ? s.strings.fio_address_confirm_screen_label : s.strings.fio_domain_label}
            body={this.isFioAddress() ? fioName : `${FIO_ADDRESS_DELIMITER}${fioName}`}
          />
          <FioActionSubmit onSubmit={this.saveFioName} getOperationFee={this.getFee} fioWallet={paymentWallet} />
        </View>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles(() => ({
  scene: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch'
  }
}))

export const FioNameConfirmScene = connect<StateProps, {}, NavigationProps>(
  state => ({
    fioPlugin: state.core.account.currencyConfig[CURRENCY_PLUGIN_NAMES.FIO],
    isConnected: state.network.isConnected
  }),
  dispatch => ({})
)(FioNameConfirm)
