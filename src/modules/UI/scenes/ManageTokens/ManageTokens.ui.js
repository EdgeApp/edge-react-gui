// @flow

import React, {Component} from 'react'
import {View, FlatList, ActivityIndicator} from 'react-native'
import {Actions} from 'react-native-router-flux'
import SafeAreaView from '../../components/SafeAreaView'

import type {AbcMetaToken} from 'airbitz-core-types'
import type { GuiWallet, CustomTokenInfo } from '../../../../types'

import * as UTILS from '../../../utils'
import Text from '../../components/FormattedText'
import s from '../../../../locales/strings.js'
import Gradient from '../../components/Gradient/Gradient.ui'
import ManageTokenRow from './ManageTokenRow.ui.js'
import {PrimaryButton, SecondaryButton} from '../../components/Buttons'
import styles from './style.js'

export type Props = {
  guiWallet: GuiWallet,
  manageTokensPending: boolean,
  settingsCustomTokens: Array<CustomTokenInfo>
}
export type DispatchProps = {
  getEnabledTokensList: (string) => void,
  setEnabledTokensList: (string, Array<string>, Array<string>) => void
}
export type State = {
  enabledList: Array<string>,
  combinedCurrencyInfos: Array<AbcMetaToken>
}
export default class ManageTokens extends Component<Props & DispatchProps, State> {
  constructor (props: Props & DispatchProps) {
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
                  keyExtractor={(item) => item.currencyCode}
                  data={sortedTokenInfo}
                  renderItem={(metaToken) =>
                  <ManageTokenRow
                    goToEditTokenScene={this.goToEditTokenScene}
                    metaToken={metaToken}
                    walletId={this.props.guiWallet.id}
                    toggleToken={this.toggleToken}
                    enabledList={this.state.enabledList}
                    customTokensList={this.props.settingsCustomTokens}
                    metaTokens={this.props.guiWallet.metaTokens}
                  />}
                  style={[styles.tokenList]}
                />
              </View>
              <View style={[styles.buttonsArea]}>
                <SecondaryButton
                  style={[styles.addButton]}
                  text={'Add'}
                  onPressFunction={this.goToAddTokenScene}
                />
                <PrimaryButton
                  text={'Save'}
                  style={[styles.saveButton]}
                  onPressFunction={this.saveEnabledTokenList}
                  processingElement={<ActivityIndicator />}
                  processingFlag={this.props.manageTokensPending}
                />
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  header () {
    const {name} = this.props.guiWallet
    return (
      <Gradient style={[styles.headerRow]}>
        <View style={[styles.headerTextWrap]}>
          <View style={styles.leftArea}>
            <Text style={styles.headerText}>
              {name}
            </Text>
        </View>
        </View>
      </Gradient>
    )
  }

  goToAddTokenScene = () => {
    const { id, metaTokens } = this.props.guiWallet
    Actions.addToken({walletId: id, metaTokens})
  }

  goToEditTokenScene = (currencyCode: string) => {
    const { id, metaTokens } = this.props.guiWallet
    Actions.editToken({ walletId: id, currencyCode, metaTokens })
  }
}
