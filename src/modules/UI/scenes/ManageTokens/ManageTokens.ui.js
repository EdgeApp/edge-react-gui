// @flow

import React, {Component} from 'react'
import {
  View,
  FlatList,
  ActivityIndicator
} from 'react-native'
import Text from '../../components/FormattedText'
import s from '../../../../locales/strings.js'
import Gradient from '../../components/Gradient/Gradient.ui'
import {Actions} from 'react-native-router-flux'
import {connect} from 'react-redux'
// import * as CORE_SELECTORS from '../../../Core/selectors.js'
import styles from './style.js'
import ManageTokenRow from './ManageTokenRow.ui.js'
import {PrimaryButton, SecondaryButton} from '../../components/Buttons'
import {
  getEnabledTokens,
  setEnabledTokens
} from '../../Wallets/action.js'
import type { GuiWallet } from '../../../../types'
import type {AbcMetaToken} from 'airbitz-core-types'


export type Props = {
  guiWallet: GuiWallet,
  manageTokensPending: boolean,
  accountMetaTokenInfo: Array<AbcMetaToken>
}

export type DispatchProps = {
  getEnabledTokensList: (string) => void,
  setEnabledTokensList: (string, Array<string>, Array<string>) => void
}

export type State = {
  enabledList: Array<string>,
  combinedCurrencyInfos: Array<AbcMetaToken>
}

class ManageTokens extends Component<Props & DispatchProps, State> {
  constructor (props: Props & DispatchProps) {
    super(props)
    this.state = {
      enabledList: this.props.guiWallet.enabledTokens || [],
      combinedCurrencyInfos: []
    }
  }

  componentDidMount () {
    const { metaTokens } = this.props.guiWallet
    let accountMetaTokenInfo = this.props.accountMetaTokenInfo || []
    let combinedTokenInfo = this.mergeTokens(metaTokens, accountMetaTokenInfo)

    let sortedTokenInfo = combinedTokenInfo.sort((a, b) => {
      if (a.currencyCode < b.currencyCode) return -1
      if (a === b) return 0
      return 1
    })

    this.setState({
      combinedCurrencyInfos: sortedTokenInfo
    })
  }

  toggleToken = (currencyCode) => {
    let newEnabledList = this.state.enabledList
    let index = newEnabledList.indexOf(currencyCode)
    if (index >= 0) {
      newEnabledList.splice(index, 1)
    } else {
      newEnabledList.push(currencyCode)
    }
    this.setState({
      enabledList: newEnabledList
    })
  }

  // will take the metaTokens property on the wallet (that comes from currencyInfo), merge with account-level custom tokens added, and only return if enabled (wallet-specific)
  mergeTokens (metaTokens: Array<AbcMetaToken>, accountTokenInfo: Array<AbcMetaToken>) {
    let tokensEnabled = metaTokens // initially set the array to currencyInfo (from plugin), since it takes priority
    for (let x of accountTokenInfo) { // loops through the account-level array
      let found = false // assumes it is not present in the currencyInfo from plugin
      for (let prop of tokensEnabled) { // loops through currencyInfo array to see if already present
        if ((x.currencyCode === prop.currencyCode) && (x.currencyName === prop.currencyName)) {
          found = true // if present, then set 'found' to true
        }
      }
      if (!found) tokensEnabled.push(x) // if not already in the currencyInfo, then add to tokensEnabled array
    }
    return tokensEnabled
  }

  saveEnabledTokenList = () => {
    const { id } = this.props.guiWallet
    let disabledList: Array<string> = []
    // get disabled list
    for (let val of this.state.combinedCurrencyInfos) {
      if (this.state.enabledList.indexOf(val.currencyCode) === -1) disabledList.push(val.currencyCode)
    }
    this.props.setEnabledTokensList(id, this.state.enabledList, disabledList)
    Actions.pop()
  }

  render () {

    return (
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
                data={this.state.combinedCurrencyInfos}
                renderItem={(metaToken) => <ManageTokenRow metaToken={metaToken} toggleToken={this.toggleToken} enabledList={this.state.enabledList} />}
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
    const { id } = this.props.guiWallet
    Actions.addToken({walletId: id})
  }
}

const mapStateToProps = (state: any, ownProps: any): Props => ({
  manageTokensPending: state.ui.wallets.manageTokensPending,
  guiWallet: ownProps.guiWallet,
  accountMetaTokenInfo: state.ui.something

})
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  getEnabledTokensList: (walletId: string) => dispatch(getEnabledTokens(walletId)),
  setEnabledTokensList: (walletId: string, enabledTokens: Array<string>, oldEnabledTokensList: Array<string>) => dispatch(setEnabledTokens(walletId, enabledTokens, oldEnabledTokensList))

})
export default connect(mapStateToProps, mapDispatchToProps)(ManageTokens)
