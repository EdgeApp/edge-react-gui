// @flow

import type { EdgeMetaToken } from 'edge-core-js'
import _ from 'lodash'
import * as React from 'react'
import { FlatList, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { checkEnabledTokensArray, setWalletEnabledTokens } from '../../actions/WalletActions'
import s from '../../locales/strings.js'
import { type RootState } from '../../types/reduxTypes.js'
import type { CustomTokenInfo, GuiWallet } from '../../types/types.js'
import { getFilteredTokens, getTokens, TokenRow, TokensHeader } from '../common/ManageTokens'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext'
import SceneFooter from '../themed/SceneFooter'
import { SceneHeader } from '../themed/SceneHeader'
import { SecondaryButton } from '../themed/ThemedButtons'

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
  combinedCurrencyInfos: EdgeMetaToken[],
  tokens: EdgeMetaToken[],
  searchValue: string
}

class ManageTokensScene extends React.Component<ManageTokensProps, State> {
  constructor(props: ManageTokensProps) {
    super(props)

    const { metaTokens, currencyCode, enabledTokens } = this.props.guiWallet

    this.state = {
      enabledList: [...enabledTokens],
      combinedCurrencyInfos: [],
      tokens: getTokens({
        metaTokens,
        customTokens: this.props.settingsCustomTokens,
        currencyCode,
        guiWalletType: this.props.guiWallet.type
      }),
      searchValue: ''
    }
  }

  getFilteredTokensHandler() {
    return getFilteredTokens(this.state.searchValue, this.state.tokens)
  }

  changeSearchValue = value => {
    this.setState({ searchValue: value })
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
    const { name, currencyCode } = this.props.guiWallet
    const { manageTokensPending } = this.props

    const { theme } = this.props

    const styles = getStyles(theme)

    return (
      <SceneWrapper>
        <View style={styles.container}>
          <SceneHeader underline>
            <TokensHeader
              walletName={name}
              walletId={this.props.guiWallet.id}
              currencyCode={currencyCode}
              changeSearchValue={this.changeSearchValue}
              searchValue={this.state.searchValue}
            />
          </SceneHeader>
          <View style={styles.tokensWrapper}>
            <View style={styles.tokensArea}>
              <FlatList
                keyExtractor={item => item.currencyCode}
                data={this.getFilteredTokensHandler()}
                renderItem={metaToken => (
                  <TokenRow
                    goToEditTokenScene={this.goToEditTokenScene}
                    metaToken={metaToken}
                    walletId={this.props.guiWallet.id}
                    symbolImage={this.props.guiWallet.symbolImage}
                    toggleToken={this.toggleToken}
                    enabledList={this.state.enabledList}
                    metaTokens={this.props.guiWallet.metaTokens}
                  />
                )}
              />
            </View>
            <SceneFooter style={styles.buttonsArea} underline>
              <SecondaryButton
                label={s.strings.string_save}
                spinner={manageTokensPending}
                onPress={this.saveEnabledTokenList}
                marginRem={[0.75]}
                paddingRem={[0.3, 2.3, 0.5, 2.3]}
              />
              <SecondaryButton label={s.strings.addtoken_add} onPress={this.goToAddTokenScene} marginRem={[0.75]} paddingRem={[0.3, 0.5, 0.5, 0.5]} />
            </SceneFooter>
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
    flex: 1
  },
  tokensWrapper: {
    flex: 1
  },
  tokensArea: {
    flex: 4
  },
  buttonsArea: {
    flex: 1,
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
