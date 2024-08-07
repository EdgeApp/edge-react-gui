import * as React from 'react'
import { View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { FlatList } from 'react-native-gesture-handler'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { FIO_ADDRESS_DELIMITER, FIO_DOMAIN_DEFAULT } from '../../constants/WalletAndCurrencyConstants'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { FioDomain, FlatListItem } from '../../types/types'
import { ButtonsView } from '../buttons/ButtonsView'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SearchIconAnimated } from '../icons/ThemedIcons'
import { EdgeModal } from '../modals/EdgeModal'
import { cacheStyles, Theme, ThemeProps, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ModalFooter } from '../themed/ModalParts'
import { SimpleTextInput } from '../themed/SimpleTextInput'

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
        <View style={styles.registerDomainRow}>
          <ButtonsView
            tertiary={{
              label: lstrings.fio_address_list_domain_register,
              onPress: this.registerNewDomain
            }}
          />
        </View>
      )
    }
    if (value) {
      return (
        <EdgeTouchableOpacity onPress={() => this.selectItem(value)}>
          <View style={styles.rowContainerTop}>
            <EdgeText style={styles.domainListRowName}>{label}</EdgeText>
            <EdgeText style={styles.domainListRowFree}>{value.isFree ? lstrings.fio_domain_free : ''}</EdgeText>
          </View>
        </EdgeTouchableOpacity>
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
      <EdgeModal bridge={bridge} onCancel={() => bridge.resolve(undefined)} title={lstrings.fio_address_choose_domain_label}>
        <SimpleTextInput
          aroundRem={0.5}
          autoCorrect={false}
          returnKeyType="search"
          autoCapitalize="none"
          placeholder={lstrings.fio_domain_label}
          onChangeText={this.onSearchFilterChange}
          onSubmitEditing={this.selectCustom}
          value={input}
          iconComponent={SearchIconAnimated}
        />
        <FlatList
          data={items}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
          contentContainerStyle={styles.scrollPadding}
          scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
        />
      </EdgeModal>
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
    alignSelf: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.lineDivider,
    width: '100%'
  },
  domainRegisterIcon: {
    marginTop: theme.rem(0.25)
  },
  scrollPadding: {
    paddingBottom: theme.rem(ModalFooter.bottomRem)
  }
}))

export function DomainListModal(props: OwnProps): JSX.Element {
  const theme = useTheme()

  const userDomains = useSelector(state => state.ui.fioAddress.fioDomains)

  return <DomainListModalComponent {...props} theme={theme} userDomains={userDomains} />
}
