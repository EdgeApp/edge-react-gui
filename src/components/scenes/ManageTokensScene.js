// @flow

import type { EdgeMetaToken } from 'edge-core-js'
import _ from 'lodash'
import * as React from 'react'
import { FlatList, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { checkEnabledTokensArray, setWalletEnabledTokens } from '../../actions/WalletActions.js'
import { getSpecialCurrencyInfo, PREFERRED_TOKENS } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type RootState } from '../../types/reduxTypes.js'
import type { CustomTokenInfo, GuiWallet } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import * as UTILS from '../../util/utils'
import ManageTokenRow from '../common/ManageTokenRow.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { SettingsHeaderRow } from '../themed/SettingsHeaderRow.js'
import { SecondaryButton } from '../themed/ThemedButtons'
import { WalletProgressIcon } from '../themed/WalletProgressIcon.js'

export type ManageTokensOwnProps = {
  guiWallet: GuiWallet
}
export type ManageTokensDispatchProps = {
  setEnabledTokensList: (string, string[], string[]) => void
}

export type ManageTokensStateProps = {
  guiWallet: GuiWallet,
  manageTokensPending: boolean,
  settingsCustomTokens: CustomTokenInfo[]
}

type ManageTokensProps = ManageTokensOwnProps & ManageTokensDispatchProps & ManageTokensStateProps & ThemeProps

type State = {
  enabledList: string[],
  combinedCurrencyInfos: EdgeMetaToken[]
}

class ManageTokensScene extends React.Component<ManageTokensProps, State> {
  constructor(props: ManageTokensProps) {
    super(props)
    this.state = {
      enabledList: [...this.props.guiWallet.enabledTokens],
      combinedCurrencyInfos: []
    }
  }

  toggleToken = (currencyCode: string) => {
    const newEnabledList = this.state.enabledList
    const index = newEnabledList.indexOf(currencyCode)
    if (index >= 0) {
      newEnabledList.splice(index, 1)
    } else {
      newEnabledList.push(currencyCode)
    }
    this.setState({
      enabledList: newEnabledList
    })
  }

  saveEnabledTokenList = () => {
    const { id } = this.props.guiWallet
    const disabledList: string[] = []
    // get disabled list
    for (const val of this.state.combinedCurrencyInfos) {
      if (this.state.enabledList.indexOf(val.currencyCode) === -1) disabledList.push(val.currencyCode)
    }
    this.props.setEnabledTokensList(id, this.state.enabledList, disabledList)
    Actions.pop()
  }

  render() {
    const { metaTokens, name, currencyCode } = this.props.guiWallet
    const { manageTokensPending } = this.props

    let accountMetaTokenInfo = []
    const specialCurrencyInfo = getSpecialCurrencyInfo(currencyCode)
    // this will need refactoring later
    if (specialCurrencyInfo.isCustomTokensSupported) {
      accountMetaTokenInfo = [...this.props.settingsCustomTokens]
    }
    const filteredTokenInfo = accountMetaTokenInfo.filter(token => {
      return token.walletType === this.props.guiWallet.type || token.walletType === undefined
    })
    const combinedTokenInfo = UTILS.mergeTokensRemoveInvisible(metaTokens, filteredTokenInfo)

    const sortedTokenInfo = combinedTokenInfo.sort((a, b) => {
      if (a.currencyCode < b.currencyCode) return -1
      if (a === b) return 0
      return 1
    })

    // put preferred tokens at the top
    for (const cc of PREFERRED_TOKENS) {
      const idx = sortedTokenInfo.findIndex(e => e.currencyCode === cc)
      if (idx > -1) {
        const tokenInfo = sortedTokenInfo[idx]
        sortedTokenInfo.splice(idx, 1)
        sortedTokenInfo.unshift(tokenInfo)
      }
    }

    const { theme } = this.props

    const styles = getStyles(theme)

    const HeaderIcon = <WalletProgressIcon currencyCode={currencyCode} walletId={this.props.guiWallet.id} size={theme.rem(1.5)} />

    return (
      <SceneWrapper>
        <SettingsHeaderRow text={name} icon={HeaderIcon} />
        <View style={styles.container}>
          <View style={styles.instructionalArea}>
            <Text style={styles.instructionalText}>{s.strings.managetokens_top_instructions}</Text>
          </View>
          <View style={styles.metaTokenListArea}>
            <View style={styles.metaTokenListWrap}>
              <FlatList
                keyExtractor={item => item.currencyCode}
                data={sortedTokenInfo}
                renderItem={metaToken => (
                  <ManageTokenRow
                    goToEditTokenScene={this.goToEditTokenScene}
                    metaToken={metaToken}
                    walletId={this.props.guiWallet.id}
                    symbolImage={this.props.guiWallet.symbolImage}
                    toggleToken={this.toggleToken}
                    enabledList={this.state.enabledList}
                    metaTokens={this.props.guiWallet.metaTokens}
                  />
                )}
                style={styles.tokenList}
              />
            </View>
            <View style={styles.buttonsArea}>
              <SecondaryButton
                label={s.strings.string_save}
                spinner={manageTokensPending}
                onPress={this.saveEnabledTokenList}
                marginRem={[0.75]}
                paddingRem={[0.5, 2.7]}
              />
              <SecondaryButton label={s.strings.addtoken_add} onPress={this.goToAddTokenScene} marginRem={[0.75]} paddingRem={[0.5, 1]} />
            </View>
          </View>
        </View>
      </SceneWrapper>
    )
  }

  _onDeleteToken = (currencyCode: string) => {
    const enabledListAfterDelete = _.difference(this.state.enabledList, [currencyCode])
    this.setState({
      enabledList: enabledListAfterDelete
    })
  }

  _onAddToken = (currencyCode: string) => {
    const newEnabledList = _.union(this.state.enabledList, [currencyCode])
    this.setState({
      enabledList: newEnabledList
    })
  }

  goToAddTokenScene = () => {
    const { id, metaTokens } = this.props.guiWallet
    Actions.addToken({ walletId: id, metaTokens, onAddToken: this._onAddToken })
  }

  goToEditTokenScene = (currencyCode: string) => {
    const { id, metaTokens } = this.props.guiWallet
    Actions.editToken({ walletId: id, currencyCode, metaTokens, onDeleteToken: this._onDeleteToken })
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    position: 'relative',
    flex: 1,
    paddingBottom: scale(50)
  },
  instructionalArea: {
    paddingVertical: scale(16),
    paddingHorizontal: scale(20)
  },
  instructionalText: {
    fontSize: theme.rem(0.85),
    textAlign: 'left',
    color: theme.deactivatedText
  },
  metaTokenListArea: {
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.GRAY_3,
    flex: 1
  },
  metaTokenListWrap: {
    flex: 1
  },
  tokenList: {
    flex: 1
  },
  buttonsArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch'
  }
}))

const mapStateToProps = (state: RootState, ownProps: ManageTokensOwnProps): ManageTokensStateProps => ({
  manageTokensPending: state.ui.wallets.manageTokensPending,
  guiWallet: ownProps.guiWallet,
  settingsCustomTokens: state.ui.settings.customTokens
})

const mapDispatchToProps = (dispatch: Dispatch): ManageTokensDispatchProps => ({
  setEnabledTokensList: (walletId: string, enabledTokens: string[], oldEnabledTokensList: string[]) => {
    dispatch(setWalletEnabledTokens(walletId, enabledTokens, oldEnabledTokensList))
    dispatch(checkEnabledTokensArray(walletId, enabledTokens))
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(ManageTokensScene))
