import { FlashList } from '@shopify/flash-list'
import * as React from 'react'
import { Alert, Keyboard, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { cacheStyles } from 'react-native-patina'

import { setDefaultFiatRequest } from '../../actions/SettingsActions'
import { FIAT_COUNTRY } from '../../constants/CountryConstants'
import { lstrings } from '../../locales/strings'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { connect } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { Theme } from '../../types/Theme'
import { FlatListItem, GuiFiatType } from '../../types/types'
import { scale } from '../../util/scaling'
import { getSupportedFiats } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { ThemeProps, withTheme } from '../services/ThemeContext'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'
import { SceneHeader } from '../themed/SceneHeader'
import { SelectableRow } from '../themed/SelectableRow'

interface OwnProps extends EdgeSceneProps<'defaultFiatSetting'> {}

interface StateProps {
  supportedFiats: GuiFiatType[]
}
interface DispatchProps {
  onSelectFiat: (selectedDefaultFiat: string) => Promise<void>
}
type Props = StateProps & DispatchProps & OwnProps & ThemeProps

interface State {
  supportedFiats: GuiFiatType[]
  selectedFiat: string
  searchTerm: string
}

export class DefaultFiatSettingComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      searchTerm: '',
      supportedFiats: props.supportedFiats,
      selectedFiat: ''
    }
  }

  handleSearchTermChange = (searchTerm: string): void => {
    this.setState({
      searchTerm
    })
  }

  renderFiatTypeResult = (data: FlatListItem<GuiFiatType>) => {
    const styles = getStyles(this.props.theme)
    const fiatCountry = FIAT_COUNTRY[data.item.value]
    if (!fiatCountry) {
      return null
    }

    return (
      <SelectableRow
        icon={fiatCountry.logoUrl ? <FastImage source={{ uri: fiatCountry.logoUrl }} style={styles.cryptoTypeLogo} /> : <View style={styles.cryptoTypeLogo} />}
        paddingRem={[0, 1]}
        // @ts-expect-error
        subTitle={lstrings[`currency_label_${data.item.value}`]}
        title={data.item.value}
        onPress={() => this.onSelectFiat(data.item)}
      />
    )
  }

  render() {
    const { theme } = this.props
    const styles = getStyles(this.props.theme)
    const filteredArray = this.props.supportedFiats.filter(entry => {
      return entry.label.toLowerCase().includes(this.state.searchTerm.toLowerCase())
    })

    return (
      <SceneWrapper avoidKeyboard background="theme" hasTabs={false}>
        {gap => (
          <View style={[styles.content, { marginBottom: -gap.bottom }]}>
            <SceneHeader title={lstrings.title_create_wallet_select_fiat} underline withTopMargin>
              <OutlinedTextInput
                autoCorrect={false}
                autoCapitalize="words"
                onChangeText={this.handleSearchTermChange}
                value={this.state.searchTerm}
                label={lstrings.fragment_wallets_addwallet_fiat_hint}
                returnKeyType="search"
                marginRem={[1, 0.5, 0]}
                searchIcon
              />
            </SceneHeader>
            <FlashList
              automaticallyAdjustContentInsets={false}
              contentContainerStyle={{ paddingBottom: gap.bottom }}
              data={filteredArray}
              estimatedItemSize={theme.rem(1.75)}
              keyboardShouldPersistTaps="handled"
              keyExtractor={this.keyExtractor}
              renderItem={this.renderFiatTypeResult}
            />
          </View>
        )}
      </SceneWrapper>
    )
  }

  onSelectFiat = ({ value: selectedFiat }: { value: string }) => {
    const { navigation } = this.props
    if (!this.isValidFiat(selectedFiat)) {
      Alert.alert(lstrings.fragment_create_wallet_select_valid)
    } else {
      this.setState({ selectedFiat })
      Keyboard.dismiss()
      this.props.onSelectFiat(selectedFiat).catch(err => showError(err))
      navigation.goBack()
    }
  }

  isValidFiat = (selectedFiat: string) => {
    const { supportedFiats } = this.state

    const isValid = supportedFiats.find(fiat => fiat.value === selectedFiat)

    return isValid
  }

  keyExtractor = (item: GuiFiatType) => `${item.label}${item.value}`
}

const getStyles = cacheStyles((theme: Theme) => ({
  content: {
    flex: 1,
    paddingTop: scale(5)
  },
  cryptoTypeLogo: {
    width: theme.rem(2),
    height: theme.rem(2),
    borderRadius: theme.rem(1),
    marginLeft: theme.rem(0.25),
    backgroundColor: theme.backgroundGradientColors[1]
  }
}))

export const DefaultFiatSettingScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    supportedFiats: getSupportedFiats(getDefaultFiat(state))
  }),
  dispatch => ({
    async onSelectFiat(selectedDefaultFiat) {
      await dispatch(setDefaultFiatRequest(selectedDefaultFiat))
    }
  })
)(withTheme(DefaultFiatSettingComponent))
