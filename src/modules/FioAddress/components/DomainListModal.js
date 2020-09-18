// @flow

import { FormField, MaterialInputStyle } from 'edge-components'
import type { EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { FlatList, Image, StyleSheet, Text, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import fioAddressIcon from '../../../assets/images/list_fioAddress.png'
import { type AirshipBridge, AirshipModal, dayText, IconCircle, THEME } from '../../../components/modals/modalParts.js'
import * as Constants from '../../../constants/indexConstants'
import s from '../../../locales/strings.js'
import type { State as StateType } from '../../../types/reduxTypes'
import type { FioDomain, FlatListItem } from '../../../types/types.js'
import { scale } from '../../../util/scaling.js'
import T from '../../UI/components/FormattedText/FormattedText.ui.js'
import { Icon } from '../../UI/components/Icon/Icon.ui'
import { getFioWallets } from '../../UI/selectors'

type Item = {
  label: string,
  value: FioDomain,
  isFree?: boolean,
  createNew?: boolean
}

type StateProps = {
  userDomains: FioDomain[],
  fioWallets: EdgeCurrencyWallet[],
  fioPlugin: EdgeCurrencyConfig | null
}

type OwnProps = {
  bridge: AirshipBridge<FioDomain | null>,
  publicDomains: FioDomain[]
}

type State = {
  input: string,
  domains: Item[],
  prevDomainsJson: string
}

type Props = OwnProps & StateProps

const newDomainItem = {
  createNew: true,
  value: { ...Constants.FIO_DOMAIN_DEFAULT, name: s.strings.fio_address_list_register_domain },
  label: s.strings.fio_address_list_register_domain
}

class DomainListModalConnected extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      input: '',
      domains: [],
      prevDomainsJson: ''
    }
  }

  static getDerivedStateFromProps(props, state) {
    const { publicDomains, userDomains } = props

    const prevDomainsJson = JSON.stringify([...publicDomains, ...userDomains])
    if (prevDomainsJson === state.prevDomainsJson) {
      return null
    }

    const domains = publicDomains.map((pubDomain: FioDomain) => ({
      value: pubDomain,
      label: `${Constants.FIO_ADDRESS_DELIMITER}${pubDomain.name}`
    }))
    const userDomainsConverted = []
    for (const fioDomain of userDomains) {
      userDomainsConverted.push({ value: fioDomain, label: `${Constants.FIO_ADDRESS_DELIMITER}${fioDomain.name}` })
    }
    userDomainsConverted.sort((userDomainA: Item, userDomainB: Item) => (userDomainA.value.name < userDomainB.value.name ? -1 : 1))

    return { domains: [...domains, ...userDomainsConverted], prevDomainsJson }
  }

  getItems = () => {
    const { domains, input } = this.state

    if (input === '') {
      return [...domains, newDomainItem]
    }

    // Search Input Filter
    const inputLowerCase = input.toLowerCase()
    const filteredRecords = []
    for (const item of domains) {
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

  selectItem = (value: any) => this.props.bridge.resolve(value)
  renderItem = ({ item }: FlatListItem<Item>) => {
    const { value, label, createNew } = item
    if (createNew) {
      return (
        <TouchableHighlight onPress={Actions[Constants.FIO_DOMAIN_REGISTER]} underlayColor={THEME.COLORS.TRANSPARENT}>
          <View style={[styles.rowContainerTop, styles.domainListRowContainerTop]}>
            <View style={styles.walletDetailsContainer}>
              <View style={styles.walletDetailsRow}>
                <T style={styles.domainListRowName}>{label}</T>
                <Icon type={Constants.FONT_AWESOME} name={Constants.ANGLE_RIGHT} size={THEME.rem(1)} />
              </View>
            </View>
          </View>
        </TouchableHighlight>
      )
    }
    if (value) {
      return (
        <TouchableHighlight onPress={() => this.selectItem(value)} underlayColor={THEME.COLORS.TRANSPARENT}>
          <View style={[styles.rowContainerTop, styles.domainListRowContainerTop]}>
            <View style={styles.walletDetailsContainer}>
              <View style={styles.walletDetailsRow}>
                <T style={styles.domainListRowName}>{label}</T>
                <T style={styles.domainListRowFree}>{value.isFree ? s.strings.fio_domain_free : ''}</T>
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

const rawStyles = {
  rowContainerTop: {
    width: '100%',
    height: scale(76),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: scale(10),
    paddingRight: scale(10),
    borderBottomWidth: scale(1),
    borderBottomColor: THEME.COLORS.GRAY_3
  },
  walletDetailsContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  walletDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  domainListRowName: {
    flex: 1,
    fontSize: THEME.rem(1),
    color: THEME.COLORS.SECONDARY
  },
  domainListRowFree: {
    flex: 1,
    fontSize: THEME.rem(0.75),
    textTransform: 'uppercase',
    color: THEME.COLORS.ACCENT_RED,
    textAlign: 'right'
  },
  domainListRowContainerTop: {
    height: 'auto',
    paddingLeft: THEME.rem(0.75),
    paddingRight: THEME.rem(0.75),
    paddingVertical: THEME.rem(0.75)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const DomainListModal = connect((state: StateType): StateProps => {
  const { account } = state.core
  const fioWallets: EdgeCurrencyWallet[] = getFioWallets(state)
  const fioPlugin = account.currencyConfig ? account.currencyConfig[Constants.CURRENCY_PLUGIN_NAMES.FIO] : null
  return {
    userDomains: state.ui.scenes.fioAddress.fioDomains,
    fioWallets,
    fioPlugin
  }
})(DomainListModalConnected)
