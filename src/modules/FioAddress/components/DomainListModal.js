// @flow

import { FormField, MaterialInputStyle } from 'edge-components'
import type { EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { FlatList, Image, Linking, Text, TouchableHighlight, View } from 'react-native'
import { connect } from 'react-redux'

import fioAddressIcon from '../../../assets/images/list_fioAddress.png'
import { type AirshipBridge, AirshipModal, dayText, IconCircle, THEME } from '../../../components/modals/modalParts.js'
import { showError } from '../../../components/services/AirshipInstance'
import * as Constants from '../../../constants/indexConstants'
import s from '../../../locales/strings.js'
import { CryptoExchangeWalletListRowStyle as styles } from '../../../styles/components/CryptoExchangeWalletListRowStyle.js'
import { styles as fioAddressRegisterStyles } from '../../../styles/scenes/FioAddressRegisterStyle'
import type { State as StateType } from '../../../types/reduxTypes'
import type { FioDomain, FlatListItem } from '../../../types/types.js'
import { scale } from '../../../util/scaling.js'
import T from '../../UI/components/FormattedText/FormattedText.ui.js'
import { Icon } from '../../UI/components/Icon/Icon.ui'
import { getFioWallets } from '../../UI/selectors'

type Item = {
  label: string,
  value: FioDomain,
  createNew?: boolean
}

type StateProps = {
  domains: Item[],
  fioWallets: EdgeCurrencyWallet[],
  fioPlugin: EdgeCurrencyConfig | null
}

type OwnProps = {
  bridge: AirshipBridge<FioDomain | null>
}

type State = {
  input: string
}

type Props = OwnProps & StateProps

const defaultDomainItem = { value: Constants.FIO_DOMAIN_DEFAULT, label: `${Constants.FIO_ADDRESS_DELIMITER}${Constants.FIO_DOMAIN_DEFAULT.name}` }
const newDomainItem = {
  createNew: true,
  value: { ...Constants.FIO_DOMAIN_DEFAULT, name: s.strings.fio_address_list_register_domain },
  label: s.strings.fio_address_list_register_domain
}

class DomainListModalConnected extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      input: ''
    }
  }

  getItems = () => {
    const { domains } = this.props
    const { input } = this.state

    if (input === '') {
      return [defaultDomainItem, ...domains, newDomainItem]
    }

    // Search Input Filter
    const inputLowerCase = input.toLowerCase()
    const filteredRecords = []
    for (const item of [defaultDomainItem, ...domains]) {
      const { label, value } = item

      if (value) {
        const labelString = label.toLowerCase()
        if (labelString.includes(inputLowerCase)) {
          filteredRecords.push(item)
        }
      }
    }
    return filteredRecords
  }

  createNew = async () => {
    const { fioPlugin, fioWallets } = this.props
    if (!fioPlugin) return
    const publicKey = fioWallets[0].publicWalletInfo.keys.publicKey
    const url = `${await fioPlugin.otherMethods.getRegDomainUrl()}${publicKey}`
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url)
      } else {
        console.log("Don't know how to open URI: " + url)
        showError("Don't know how to open URI: " + url)
      }
    })
  }

  selectItem = (value: any) => this.props.bridge.resolve(value)
  renderItem = ({ item }: FlatListItem<Item>) => {
    const { value, label, createNew } = item
    if (createNew) {
      return (
        <TouchableHighlight style={styles.touchable} onPress={this.createNew} underlayColor={styles.underlayColor}>
          <View style={[styles.rowContainerTop, fioAddressRegisterStyles.domainListRowContainerTop]}>
            <View style={styles.walletDetailsContainer}>
              <View style={styles.walletDetailsRow}>
                <T style={fioAddressRegisterStyles.domainListRowName}>{label}</T>
                <Icon type={Constants.FONT_AWESOME} name={Constants.ANGLE_RIGHT} size={fioAddressRegisterStyles.domainListRowName.fontSize} />
              </View>
            </View>
          </View>
        </TouchableHighlight>
      )
    }
    if (value) {
      return (
        <TouchableHighlight style={styles.touchable} onPress={() => this.selectItem(value)} underlayColor={styles.underlayColor}>
          <View style={[styles.rowContainerTop, fioAddressRegisterStyles.domainListRowContainerTop]}>
            <View style={styles.walletDetailsContainer}>
              <View style={styles.walletDetailsRow}>
                <T style={fioAddressRegisterStyles.domainListRowName}>{label}</T>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      )
    }
    return null
  }

  keyExtractor = (item: Item, index: number) => index.toString()
  onSearchFilterChange = (input: string) => this.setState({ input })
  render() {
    const { bridge } = this.props
    const { input } = this.state
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(null)}>
        {gap => (
          <>
            <IconCircle>
              <Image source={fioAddressIcon} style={{ marginLeft: THEME.rem(0.1) }} resizeMode="cover" />
            </IconCircle>
            <View style={{ flex: 1 }}>
              <Text style={{ ...dayText('title'), marginTop: scale(10), marginBottom: 0, paddingHorizontal: scale(60) }}>
                {s.strings.fio_address_choose_domain_label}
              </Text>
              <View style={{ marginHorizontal: THEME.rem(0.75) }}>
                <FormField autoFocus keyboardType="default" label="" onChangeText={this.onSearchFilterChange} style={MaterialInputStyle} value={input} />
              </View>
              <FlatList
                style={{ flex: 1, marginBottom: -gap.bottom }}
                contentContainerStyle={{ paddingBottom: gap.bottom }}
                data={this.getItems()}
                initialNumToRender={24}
                keyboardShouldPersistTaps="handled"
                keyExtractor={this.keyExtractor}
                renderItem={this.renderItem}
              />
            </View>
          </>
        )}
      </AirshipModal>
    )
  }
}

const DomainListModal = connect((state: StateType): StateProps => {
  const { account } = state.core
  const fioWallets: EdgeCurrencyWallet[] = getFioWallets(state)
  const fioPlugin = account.currencyConfig ? account.currencyConfig[Constants.CURRENCY_PLUGIN_NAMES.FIO] : null
  const domains = state.ui.scenes.fioAddress.fioDomains.map(fioDomain => ({ value: fioDomain, label: `${Constants.FIO_ADDRESS_DELIMITER}${fioDomain.name}` }))
  return {
    domains,
    fioWallets,
    fioPlugin
  }
})(DomainListModalConnected)
export { DomainListModal }
