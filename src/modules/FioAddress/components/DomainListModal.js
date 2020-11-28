// @flow

import { FormField, MaterialInputStyle } from 'edge-components'
import type { EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { FlatList, TouchableHighlight, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { Actions } from 'react-native-router-flux'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import { connect } from 'react-redux'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../../../components/services/ThemeContext'
import { ModalCloseArrow, ModalTitle } from '../../../components/themed/ModalParts.js'
import { PrimaryButton } from '../../../components/themed/ThemedButtons.js'
import { ThemedModal } from '../../../components/themed/ThemedModal.js'
import * as Constants from '../../../constants/indexConstants'
import s from '../../../locales/strings.js'
import { type RootState } from '../../../types/reduxTypes'
import type { FioDomain, FlatListItem } from '../../../types/types.js'
import T from '../../UI/components/FormattedText/FormattedText.ui.js'
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

type Props = OwnProps & ThemeProps & StateProps

const newDomainItem = {
  createNew: true,
  value: { ...Constants.FIO_DOMAIN_DEFAULT, name: s.strings.fio_address_list_register_domain },
  label: s.strings.fio_address_list_register_domain
}

class DomainListModalComponent extends React.Component<Props, State> {
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

  selectCustom = (name: string) => {
    const fioDomain = { ...Constants.FIO_DOMAIN_DEFAULT, name }

    this.props.bridge.resolve(fioDomain)
  }

  registerNewDomain = () => {
    this.props.bridge.resolve(null)
    Actions[Constants.FIO_DOMAIN_REGISTER]()
  }

  selectItem = (value: any) => this.props.bridge.resolve(value)
  renderItem = ({ item }: FlatListItem<Item>) => {
    const { theme } = this.props
    const { value, label, createNew } = item
    const styles = getStyles(theme)
    if (createNew) {
      return (
        <TouchableHighlight onPress={this.registerNewDomain} underlayColor="transparent">
          <View style={[styles.rowContainerTop, styles.domainListRowContainerTop]}>
            <T style={styles.domainListRowName}>{label}</T>
            <FontAwesomeIcon name="angle-right" style={{ color: theme.primaryText }} size={theme.rem(1)} />
          </View>
        </TouchableHighlight>
      )
    }
    if (value) {
      return (
        <TouchableHighlight onPress={() => this.selectItem(value)} underlayColor="transparent">
          <View style={[styles.rowContainerTop, styles.domainListRowContainerTop]}>
            <T style={styles.domainListRowName}>{label}</T>
            <T style={styles.domainListRowFree}>{value.isFree ? s.strings.fio_domain_free : ''}</T>
          </View>
        </TouchableHighlight>
      )
    }
    return null
  }

  keyExtractor = (item: Item, index: number) => index.toString()
  onSearchFilterChange = (input: string) => this.setState({ input })
  render() {
    const { bridge, theme } = this.props
    const { input } = this.state
    const items = this.getItems()
    const formFieldStyles = {
      ...MaterialInputStyle,
      container: {
        ...MaterialInputStyle.container,
        paddingTop: theme.rem(0.25)
      },
      textColor: theme.primaryText,
      tintColor: theme.primaryButton
    }
    return (
      <ThemedModal bridge={bridge} onCancel={() => bridge.resolve(null)} paddingRem={0}>
        <ModalTitle>{s.strings.fio_address_choose_domain_label}</ModalTitle>
        <View style={{ marginHorizontal: theme.rem(0.75) }}>
          <FormField
            autoFocus
            keyboardType="default"
            label=""
            onChangeText={this.onSearchFilterChange}
            onSubmitEditing={() => this.selectCustom(input)}
            style={formFieldStyles}
            value={input}
          />
        </View>
        {!items.length && <PrimaryButton label={s.strings.submit} onPress={() => this.selectCustom(input)} marginRem={1} />}
        <FlatList data={items} initialNumToRender={24} keyboardShouldPersistTaps="handled" keyExtractor={this.keyExtractor} renderItem={this.renderItem} />
        <ModalCloseArrow onPress={() => bridge.resolve(null)} />
      </ThemedModal>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  rowContainerTop: {
    width: '100%',
    height: theme.rem(4.75),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: theme.rem(0.625),
    paddingRight: theme.rem(0.625),
    borderBottomWidth: theme.rem(0.05),
    borderBottomColor: theme.secondaryButtonOutline
  },
  domainListRowName: {
    flex: 1,
    fontSize: theme.rem(1),
    color: theme.primaryText
  },
  domainListRowFree: {
    flex: 1,
    fontSize: theme.rem(0.75),
    textTransform: 'uppercase',
    color: theme.negativeText,
    textAlign: 'right'
  },
  domainListRowContainerTop: {
    height: 'auto',
    paddingLeft: theme.rem(0.75),
    paddingRight: theme.rem(0.75),
    paddingVertical: theme.rem(0.75)
  }
}))

export const DomainListModal = connect((state: RootState): StateProps => {
  const { account } = state.core
  const fioWallets: EdgeCurrencyWallet[] = getFioWallets(state)
  const fioPlugin = account.currencyConfig ? account.currencyConfig[Constants.CURRENCY_PLUGIN_NAMES.FIO] : null
  return {
    userDomains: state.ui.scenes.fioAddress.fioDomains,
    fioWallets,
    fioPlugin
  }
})(withTheme(DomainListModalComponent))
