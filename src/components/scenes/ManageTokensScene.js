// @flow

import type { EdgeMetaToken } from 'edge-core-js'
import _ from 'lodash'
import * as React from 'react'
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import {
  getSpecialCurrencyInfo,
  PREFERRED_TOKENS
} from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { SecondaryButton } from '../../modules/UI/components/Buttons/SecondaryButton.ui.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import type { CustomTokenInfo, GuiWallet } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import * as UTILS from '../../util/utils'
import ManageTokenRow from '../common/ManageTokenRow.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { SettingsHeaderRow } from '../themed/SettingsHeaderRow.js'

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

type ManageTokensProps = ManageTokensOwnProps &
  ManageTokensDispatchProps &
  ManageTokensStateProps

type State = {
  enabledList: string[],
  combinedCurrencyInfos: EdgeMetaToken[]
}

export default class ManageTokens extends React.Component<
  ManageTokensProps,
  State
> {
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
      if (this.state.enabledList.indexOf(val.currencyCode) === -1)
        disabledList.push(val.currencyCode)
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
      return (
        token.walletType === this.props.guiWallet.type ||
        token.walletType === undefined
      )
    })
    const combinedTokenInfo = UTILS.mergeTokensRemoveInvisible(
      metaTokens,
      filteredTokenInfo
    )

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

    return (
      <SceneWrapper background="body">
        <SettingsHeaderRow text={name} />
        <View style={styles.container}>
          <View style={styles.instructionalArea}>
            <Text style={styles.instructionalText}>
              {s.strings.managetokens_top_instructions}
            </Text>
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
                    toggleToken={this.toggleToken}
                    enabledList={this.state.enabledList}
                    metaTokens={this.props.guiWallet.metaTokens}
                  />
                )}
                style={styles.tokenList}
              />
            </View>
            {specialCurrencyInfo.isCustomTokensSupported ? (
              <View style={styles.buttonsArea}>
                <PrimaryButton
                  style={styles.saveButton}
                  onPress={this.saveEnabledTokenList}
                >
                  {manageTokensPending ? (
                    <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} />
                  ) : (
                    <PrimaryButton.Text style={styles.buttonText}>
                      {s.strings.string_save}
                    </PrimaryButton.Text>
                  )}
                </PrimaryButton>
                <SecondaryButton
                  style={styles.addButton}
                  onPress={this.goToAddTokenScene}
                >
                  <SecondaryButton.Text style={styles.buttonText}>
                    {s.strings.addtoken_add}
                  </SecondaryButton.Text>
                </SecondaryButton>
              </View>
            ) : (
              <View style={styles.buttonsArea}>
                <PrimaryButton
                  style={styles.oneButton}
                  onPress={this.saveEnabledTokenList}
                >
                  {manageTokensPending ? (
                    <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} />
                  ) : (
                    <PrimaryButton.Text style={styles.buttonText}>
                      {s.strings.string_save}
                    </PrimaryButton.Text>
                  )}
                </PrimaryButton>
              </View>
            )}
          </View>
        </View>
      </SceneWrapper>
    )
  }

  _onDeleteToken = (currencyCode: string) => {
    const enabledListAfterDelete = _.difference(this.state.enabledList, [
      currencyCode
    ])
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
    Actions.editToken({
      walletId: id,
      currencyCode,
      metaTokens,
      onDeleteToken: this._onDeleteToken
    })
  }
}

const rawStyles = {
  container: {
    position: 'relative',
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE,
    paddingBottom: scale(50)
  },
  instructionalArea: {
    paddingVertical: scale(16),
    paddingHorizontal: scale(20)
  },
  instructionalText: {
    fontSize: scale(16),
    textAlign: 'center'
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
    height: scale(52),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: scale(4),
    paddingHorizontal: scale(20)
  },
  addButton: {
    flex: 1,
    marginLeft: scale(2),
    backgroundColor: THEME.COLORS.GRAY_2,
    borderRadius: 3
  },
  buttonText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(17.5)
  },
  saveButton: {
    flex: 1,
    marginRight: scale(2),
    backgroundColor: THEME.COLORS.SECONDARY,
    borderRadius: 3
  },
  oneButton: {
    flex: 1,
    backgroundColor: THEME.COLORS.SECONDARY,
    borderRadius: 3
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
