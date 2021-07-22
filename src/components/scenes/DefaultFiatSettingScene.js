// @flow

import * as React from 'react'
import { Alert, FlatList, Keyboard, StyleSheet, TouchableHighlight, View } from 'react-native'

import { setDefaultFiatRequest } from '../../actions/SettingsActions'
import s from '../../locales/strings.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { getDefaultFiat } from '../../selectors/SettingsSelectors.js'
import { THEME } from '../../theme/variables/airbitz'
import { connect } from '../../types/reactRedux.js'
import { Actions } from '../../types/routerTypes.js'
import type { FlatListItem, GuiFiatType } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import { getSupportedFiats } from '../../util/utils'
import { FormField } from '../common/FormField.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

type StateProps = {
  supportedFiats: GuiFiatType[]
}
type DispatchProps = {
  onSelectFiat: (selectedDefaultFiat: string) => void
}
type Props = StateProps & DispatchProps

type State = {
  supportedFiats: GuiFiatType[],
  selectedFiat: string,
  searchTerm: string
}

class DefaultFiatSettingComponent extends React.Component<Props, State> {
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

  render() {
    const filteredArray = this.props.supportedFiats.filter(entry => {
      return entry.label.toLowerCase().indexOf(this.state.searchTerm.toLowerCase()) >= 0
    })

    return (
      <SceneWrapper avoidKeyboard background="body" hasTabs={false}>
        {gap => (
          <View style={[styles.content, { marginBottom: -gap.bottom }]}>
            <FormField
              autoFocus
              autoCorrect={false}
              autoCapitalize="words"
              onChangeText={this.handleSearchTermChange}
              value={this.state.searchTerm}
              label={s.strings.settings_select_currency}
            />
            <FlatList
              style={styles.resultList}
              automaticallyAdjustContentInsets={false}
              contentContainerStyle={{ paddingBottom: gap.bottom }}
              data={filteredArray}
              initialNumToRender={30}
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
    if (!this.isValidFiat(selectedFiat)) {
      Alert.alert(s.strings.fragment_create_wallet_select_valid)
    } else {
      this.setState({ selectedFiat })
      Keyboard.dismiss()
      this.props.onSelectFiat(selectedFiat)
    }
  }

  isValidFiat = (selectedFiat: string) => {
    const { supportedFiats } = this.state

    const isValid = supportedFiats.find(fiat => fiat.value === selectedFiat)

    return isValid
  }

  renderFiatTypeResult = (data: FlatListItem<GuiFiatType>) => {
    return (
      <View style={[styles.singleFiatTypeWrap, data.item.value === this.state.selectedFiat && styles.selectedItem]}>
        <TouchableHighlight style={styles.singleFiatType} onPress={() => this.onSelectFiat(data.item)} underlayColor={stylesRaw.underlayColor.color}>
          <View style={styles.fiatTypeInfoWrap}>
            <View style={styles.fiatTypeLeft}>
              <View style={styles.fiatTypeLeftTextWrap}>
                <Text style={styles.fiatTypeName}>{data.item.label}</Text>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }

  keyExtractor = (item: GuiFiatType, index: string) => String(index)
}

const stylesRaw = {
  content: {
    backgroundColor: THEME.COLORS.WHITE,
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: scale(5)
  },
  selectedItem: {},
  resultList: {
    backgroundColor: THEME.COLORS.WHITE,
    borderTopColor: THEME.COLORS.GRAY_3,
    borderTopWidth: 1,
    flexGrow: 1,
    flexShrink: 1
  },
  singleFiatType: {
    height: scale(60),
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    paddingVertical: scale(10),
    paddingHorizontal: scale(15)
  },
  singleFiatTypeWrap: {
    flexDirection: 'column',
    flex: 1
  },
  fiatTypeInfoWrap: {
    flexDirection: 'row',
    height: scale(40),
    flex: 1,
    justifyContent: 'space-between'
  },
  fiatTypeLeft: {
    flexDirection: 'row'
  },
  fiatTypeLogo: {
    width: scale(40),
    height: scale(40),
    marginRight: scale(10)
  },
  fiatTypeLeftTextWrap: {
    justifyContent: 'center'
  },
  fiatTypeName: {
    fontSize: scale(16),
    color: THEME.COLORS.GRAY_1,
    textAlignVertical: 'center'
  },
  underlayColor: {
    color: THEME.COLORS.GRAY_4
  }
}
const styles: typeof stylesRaw = StyleSheet.create(stylesRaw)

export const DefaultFiatSettingScene = connect<StateProps, DispatchProps, {}>(
  state => ({
    supportedFiats: getSupportedFiats(getDefaultFiat(state))
  }),
  dispatch => ({
    onSelectFiat(selectedDefaultFiat) {
      dispatch(setDefaultFiatRequest(selectedDefaultFiat))
      Actions.pop()
    }
  })
)(DefaultFiatSettingComponent)
