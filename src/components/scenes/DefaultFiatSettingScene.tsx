import * as React from 'react'
import { Keyboard, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { FlatList } from 'react-native-gesture-handler'
import { cacheStyles } from 'react-native-patina'

import { setDefaultFiatRequest } from '../../actions/SettingsActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { FIAT_COUNTRY } from '../../constants/CountryConstants'
import { lstrings } from '../../locales/strings'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { connect } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { Theme } from '../../types/Theme'
import { FlatListItem, GuiFiatType } from '../../types/types'
import { getSupportedFiats } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { SearchIconAnimated } from '../icons/ThemedIcons'
import { showDevError, showToast } from '../services/AirshipInstance'
import { ThemeProps, withTheme } from '../services/ThemeContext'
import { SceneHeader } from '../themed/SceneHeader'
import { SelectableRow } from '../themed/SelectableRow'
import { SimpleTextInput } from '../themed/SimpleTextInput'

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

    const key = `currency_label_${data.item.value}`
    const subTitle = lstrings[key as keyof typeof lstrings] ?? lstrings.currency_label_

    return (
      <SelectableRow
        icon={fiatCountry.logoUrl ? <FastImage source={{ uri: fiatCountry.logoUrl }} style={styles.cryptoTypeLogo} /> : <View style={styles.cryptoTypeLogo} />}
        subTitle={subTitle}
        title={data.item.value}
        onPress={() => this.onSelectFiat(data.item)}
      />
    )
  }

  render() {
    const filteredArray = this.props.supportedFiats.filter(entry => {
      return entry.label.toLowerCase().includes(this.state.searchTerm.toLowerCase())
    })

    return (
      <SceneWrapper avoidKeyboard>
        {({ insetStyle, undoInsetStyle }) => (
          <View style={{ ...undoInsetStyle, marginTop: 0 }}>
            <SceneHeader title={lstrings.title_create_wallet_select_fiat} underline withTopMargin>
              <SimpleTextInput
                topRem={1}
                horizontalRem={0.5}
                autoCorrect={false}
                autoCapitalize="words"
                onChangeText={this.handleSearchTermChange}
                value={this.state.searchTerm}
                placeholder={lstrings.fragment_wallets_addwallet_fiat_hint}
                returnKeyType="search"
                iconComponent={SearchIconAnimated}
              />
            </SceneHeader>
            <FlatList
              automaticallyAdjustContentInsets={false}
              contentContainerStyle={{ ...insetStyle, paddingTop: 0 }}
              data={filteredArray}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              keyExtractor={this.keyExtractor}
              renderItem={this.renderFiatTypeResult}
              scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
            />
          </View>
        )}
      </SceneWrapper>
    )
  }

  onSelectFiat = ({ value: selectedFiat }: { value: string }) => {
    const { navigation } = this.props
    if (!this.isValidFiat(selectedFiat)) {
      showToast(lstrings.fragment_create_wallet_select_valid)
    } else {
      this.setState({ selectedFiat })
      Keyboard.dismiss()
      this.props.onSelectFiat(selectedFiat).catch(err => showDevError(err))
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
  cryptoTypeLogo: {
    width: theme.rem(2),
    height: theme.rem(2),
    borderRadius: theme.rem(1),
    marginLeft: theme.rem(0.25)
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
