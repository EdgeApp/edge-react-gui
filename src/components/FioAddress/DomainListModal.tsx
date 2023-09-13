import { FlashList } from '@shopify/flash-list'
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { Fontello } from '../../assets/vector'
import { FIO_ADDRESS_DELIMITER, FIO_DOMAIN_DEFAULT } from '../../constants/WalletAndCurrencyConstants'
import { lstrings } from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { FioDomain, FlatListItem } from '../../types/types'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { ClickableText } from '../themed/ClickableText'
import { EdgeText } from '../themed/EdgeText'
import { ModalFooter, ModalFooterFade, ModalTitle } from '../themed/ModalParts'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'
import { ThemedModal } from '../themed/ThemedModal'

interface Item {
  label: string
  value: FioDomain
  isFree?: boolean
  createNew?: boolean
}

interface StateProps {
  userDomains: FioDomain[]
}

interface OwnProps {
  bridge: AirshipBridge<FioDomain | undefined>
  navigation: NavigationBase
  publicDomains: FioDomain[]
}

interface State {
  input: string
  domains: Item[]
  prevDomainsJson: string
}

type Props = OwnProps & ThemeProps & StateProps

const newDomainItem = {
  createNew: true,
  value: { ...FIO_DOMAIN_DEFAULT, name: lstrings.fio_address_list_register_domain },
  label: lstrings.fio_address_list_register_domain
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

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    const { publicDomains, userDomains } = props

    const prevDomainsJson = JSON.stringify([...publicDomains, ...userDomains])
    if (prevDomainsJson === state.prevDomainsJson) {
      return null
    }

    const domains = publicDomains.map((pubDomain: FioDomain) => ({
      value: pubDomain,
      label: `${FIO_ADDRESS_DELIMITER}${pubDomain.name}`
    }))
    const userDomainsConverted: Item[] = []
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
    const filteredRecords: Item[] = []
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
    const { bridge, navigation } = this.props
    bridge.resolve(undefined)
    navigation.navigate('fioDomainRegister', {})
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
            label={lstrings.fio_address_list_domain_register}
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
            <EdgeText style={styles.domainListRowFree}>{value.isFree ? lstrings.fio_domain_free : ''}</EdgeText>
          </View>
        </TouchableOpacity>
      )
    }
    return null
  }

  keyExtractor = (item: Item) => item.value.name
  onSearchFilterChange = (input: string) => this.setState({ input })
  render() {
    const { bridge, theme } = this.props
    const { input } = this.state
    const items = this.getItems()
    const styles = getStyles(theme)

    return (
      <ThemedModal bridge={bridge} onCancel={() => bridge.resolve(undefined)} paddingRem={[1, 0]}>
        <ModalTitle center paddingRem={[0, 3, 1]}>
          {lstrings.fio_address_choose_domain_label}
        </ModalTitle>
        <View style={{ marginHorizontal: theme.rem(0.75) }}>
          <OutlinedTextInput
            autoCorrect={false}
            returnKeyType="search"
            autoCapitalize="none"
            label={lstrings.fio_domain_label}
            onChangeText={this.onSearchFilterChange}
            onSubmitEditing={this.selectCustom}
            value={input}
            marginRem={[0, 1]}
            searchIcon
          />
        </View>
        <FlashList
          data={items}
          estimatedItemSize={theme.rem(3.5)}
          keyboardShouldPersistTaps="handled"
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
          contentContainerStyle={styles.scrollPadding}
        />
        <ModalFooterFade />
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
  },
  scrollPadding: {
    paddingBottom: theme.rem(ModalFooter.bottomRem)
  }
}))

export const DomainListModal = connect<StateProps, {}, OwnProps>(
  state => ({
    userDomains: state.ui.fioAddress.fioDomains
  }),
  dispatch => ({})
)(withTheme(DomainListModalComponent))
