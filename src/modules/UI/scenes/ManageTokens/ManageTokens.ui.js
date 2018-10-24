// @flow

import type { EdgeMetaToken } from 'edge-core-js'
import _ from 'lodash'
import React, { Component } from 'react'
import { ActivityIndicator, FlatList, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import s from '../../../../locales/strings.js'
import type { CustomTokenInfo, GuiWallet } from '../../../../types'
import * as UTILS from '../../../utils'
import { PrimaryButton, SecondaryButton } from '../../components/Buttons'
import Text from '../../components/FormattedText'
import Gradient from '../../components/Gradient/Gradient.ui'
import SafeAreaView from '../../components/SafeAreaView'
import ManageTokenRow from './ManageTokenRow.ui.js'
import styles from './style.js'

export type ManageTokensOwnProps = {
  guiWallet: GuiWallet
}
export type ManageTokensDispatchProps = {
  setEnabledTokensList: (string, Array<string>, Array<string>) => void
}

export type ManageTokensStateProps = {
  guiWallet: GuiWallet,
  manageTokensPending: boolean,
  settingsCustomTokens: Array<CustomTokenInfo>
}

export type ManageTokensProps = ManageTokensOwnProps & ManageTokensDispatchProps & ManageTokensStateProps

export type State = {
  enabledList: Array<string>,
  combinedCurrencyInfos: Array<EdgeMetaToken>
}

export default class ManageTokens extends Component<ManageTokensProps, State> {
  constructor (props: ManageTokensProps) {
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
    const disabledList: Array<string> = []
    // get disabled list
    for (const val of this.state.combinedCurrencyInfos) {
      if (this.state.enabledList.indexOf(val.currencyCode) === -1) disabledList.push(val.currencyCode)
    }
    this.props.setEnabledTokensList(id, this.state.enabledList, disabledList)
    Actions.pop()
  }

  render () {
    const { metaTokens } = this.props.guiWallet
    const { manageTokensPending } = this.props
    const accountMetaTokenInfo = [...this.props.settingsCustomTokens]
    const combinedTokenInfo = UTILS.mergeTokensRemoveInvisible(metaTokens, accountMetaTokenInfo)

    const sortedTokenInfo = combinedTokenInfo.sort((a, b) => {
      if (a.currencyCode < b.currencyCode) return -1
      if (a === b) return 0
      return 1
    })

    return (
      <SafeAreaView>
        <View style={[styles.manageTokens]}>
          <Gradient style={styles.gradient} />
          <View style={styles.container}>
            {this.header()}
            <View style={styles.instructionalArea}>
              <Text style={styles.instructionalText}>{s.strings.managetokens_top_instructions}</Text>
            </View>
            <View style={[styles.metaTokenListArea]}>
              <View style={[styles.metaTokenListWrap]}>
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
                      customTokensList={this.props.settingsCustomTokens}
                      metaTokens={this.props.guiWallet.metaTokens}
                    />
                  )}
                  style={[styles.tokenList]}
                />
              </View>
              <View style={[styles.buttonsArea]}>
                <SecondaryButton style={[styles.addButton]} onPress={this.goToAddTokenScene}>
                  <SecondaryButton.Text style={[styles.buttonText]}>{s.strings.addtoken_add}</SecondaryButton.Text>
                </SecondaryButton>
                <PrimaryButton style={[styles.saveButton]} onPress={this.saveEnabledTokenList}>
                  {manageTokensPending ? <ActivityIndicator /> : <PrimaryButton.Text style={[styles.buttonText]}>{s.strings.string_save}</PrimaryButton.Text>}
                </PrimaryButton>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  header () {
    const { name } = this.props.guiWallet
    return (
      <Gradient style={[styles.headerRow]}>
        <View style={[styles.headerTextWrap]}>
          <View style={styles.leftArea}>
            <Text style={styles.headerText}>{name}</Text>
          </View>
        </View>
      </Gradient>
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
