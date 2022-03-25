// @flow

import type { EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { FlatList, TouchableOpacity, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'

import { Fontello } from '../../../assets/vector'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../../../components/services/ThemeContext'
import { ClickableText } from '../../../components/themed/ClickableText'
import { EdgeText } from '../../../components/themed/EdgeText'
import { ModalCloseArrow, ModalTitle } from '../../../components/themed/ModalParts.js'
import { OutlinedTextInput } from '../../../components/themed/OutlinedTextInput.js'
import { ThemedModal } from '../../../components/themed/ThemedModal.js'
import { FIO_DOMAIN_REGISTER } from '../../../constants/SceneKeys.js'
import { FIO_ADDRESS_DELIMITER, FIO_DOMAIN_DEFAULT } from '../../../constants/WalletAndCurrencyConstants.js'
import s from '../../../locales/strings.js'
import { connect } from '../../../types/reactRedux.js'
import { Actions } from '../../../types/routerTypes.js'
import type { FioDomain, FlatListItem } from '../../../types/types.js'

type Item = {
  label: string,
  value: FioDomain,
  isFree?: boolean,
  createNew?: boolean
}

type StateProps = {
  userDomains: FioDomain[],
  fioWallets: EdgeCurrencyWallet[],
  fioPlugin?: EdgeCurrencyConfig
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
  value: { ...FIO_DOMAIN_DEFAULT, name: s.strings.fio_address_list_register_domain },
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
      label: `${FIO_ADDRESS_DELIMITER}${pubDomain.name}`
    }))
    const userDomainsConverted = []
    for (const fioDomain of userDomains) {
      userDomainsConverted.push({ value: fioDomain, label: `${FIO_ADDRESS_DELIMITER}${fioDomain.name}` })
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

  selectCustom = () => {
    const { input } = this.state
    const fioDomain = { ...FIO_DOMAIN_DEFAULT, name: input }

    this.props.bridge.resolve(fioDomain)
  }

  registerNewDomain = () => {
    this.props.bridge.resolve(null)
    Actions.push(FIO_DOMAIN_REGISTER)
  }

  selectItem = (value: any) => this.props.bridge.resolve(value)
  renderItem = ({ item }: FlatListItem<Item>) => {
    const { theme } = this.props
    const { value, label, createNew } = item
    const styles = getStyles(theme)
    if (createNew) {
      return (
        <View style={[styles.rowContainerTop, styles.registerDomainRow]}>
          <ClickableText
            icon={<Fontello name="register-custom-fio" style={styles.domainRegisterIcon} color={theme.iconTappable} size={theme.rem(1)} />}
            label={s.strings.fio_address_list_domain_register}
            onPress={this.registerNewDomain}
            paddingRem={0}
          />
        </View>
      )
    }
    if (value) {
      return (
        <TouchableOpacity onPress={() => this.selectItem(value)}>
          <View style={styles.rowContainerTop}>
            <EdgeText style={styles.domainListRowName}>{label}</EdgeText>
            <EdgeText style={styles.domainListRowFree}>{value.isFree ? s.strings.fio_domain_free : ''}</EdgeText>
          </View>
        </TouchableOpacity>
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
    return (
      <ThemedModal bridge={bridge} onCancel={() => bridge.resolve(null)} paddingRem={[1, 0]}>
        <ModalTitle center paddingRem={[0, 3, 1]}>
          {s.strings.fio_address_choose_domain_label}
        </ModalTitle>
        <View style={{ marginHorizontal: theme.rem(0.75) }}>
          <OutlinedTextInput
            autoCorrect={false}
            returnKeyType="search"
            autoCapitalize="none"
            label={s.strings.fio_domain_label}
            onChangeText={this.onSearchFilterChange}
            onSubmitEditing={this.selectCustom}
            value={input}
            marginRem={[0, 1]}
            searchIcon
          />
        </View>
        <FlatList data={items} initialNumToRender={24} keyboardShouldPersistTaps="handled" keyExtractor={this.keyExtractor} renderItem={this.renderItem} />
        <ModalCloseArrow onPress={() => bridge.resolve(null)} />
      </ThemedModal>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  rowContainerTop: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: theme.rem(1)
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
  registerDomainRow: {
    paddingLeft: 0,
    marginLeft: theme.rem(1),
    marginTop: theme.rem(0.25),
    paddingTop: theme.rem(1),
    borderTopWidth: theme.rem(0.05),
    borderTopColor: theme.lineDivider
  },
  domainRegisterIcon: {
    marginTop: theme.rem(0.25)
  }
}))

export const DomainListModal = connect<StateProps, {}, OwnProps>(
  state => ({
    userDomains: state.ui.scenes.fioAddress.fioDomains,
    fioWallets: state.ui.wallets.fioWallets,
    fioPlugin: state.core.account.currencyConfig.fio
  }),
  dispatch => ({})
)(withTheme(DomainListModalComponent))
