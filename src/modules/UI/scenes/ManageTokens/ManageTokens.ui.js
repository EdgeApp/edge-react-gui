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
import * as UTILS from '../../../utils.js'
import {
  getEnabledTokens,
  setEnabledTokens
} from '../../Wallets/action.js'


class ManageTokens extends Component {
  constructor (props) {
    super(props)
    this.state = {
      enabledTokens: []
    }
  }

  componentDidMount () {
    let enabledTokens = []
    const { tokensEnabled } = this.props.guiWallet
    for (let prop in tokensEnabled) {
      let tokenValues = tokensEnabled[prop]
      enabledTokens.push(tokenValues)
    }
    let sortedEnabledTokens = enabledTokens.sort((a, b) => {
      return b.currencyCode - a.currencyCode
    })
    this.setState({
      enabledTokens: sortedEnabledTokens
    })
  }

  toggleToken = (currencyCode) => {
    let enabledTokens = []
    const { tokensEnabled } = this.props.guiWallet
    for (let prop in tokensEnabled) {
      if (prop === currencyCode) {
        tokensEnabled[prop].enabled = !tokensEnabled[prop].enabled
      }
      let tokenValues = tokensEnabled[prop]
      enabledTokens.push(tokenValues)
    }
    let sortedEnabledTokens = enabledTokens.sort((a, b) => {
      return b.currencyCode - a.currencyCode
    })
    this.setState({
      enabledTokens: sortedEnabledTokens
    })
  }

  saveEnabledTokenList = () => {
    const { tokensEnabled, id } = this.props.guiWallet
    const walletEnabledTokens = tokensEnabled
    for (let item of this.state.enabledTokens) {
      walletEnabledTokens[item.currencyCode].enabled = item.enabled
    }
    this.props.setEnabledTokensList(id, walletEnabledTokens)
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
          <View style={[styles.metaTokenListArea, UTILS.border()]}>
            <View style={[styles.metaTokenListWrap]}>
              <FlatList
                data={this.state.enabledTokens}
                renderItem={(metaToken) => <ManageTokenRow metaToken={metaToken} toggleToken={this.toggleToken} />}
                style={[styles.tokenList, UTILS.border()]}
              />
            </View>
            <View style={[styles.buttonsArea, UTILS.border()]}>
              <SecondaryButton
                style={[styles.addButton, UTILS.border()]}
                text={'Add'}
                onPressFunction={this.goToAddTokenScene}
              />
              <PrimaryButton
                text={'Save'}
                style={[styles.saveButton, UTILS.border()]}
                onPressFunction={this.saveEnabledTokenList}
                processingElement={<ActivityIndicator />}
                processingFlag={this.props.manageTokenPending}
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

const mapStateToProps = (state) => {
  const manageTokensPending = state.ui.wallets.manageTokensPending
  return {
    manageTokensPending
  }
}
const mapDispatchToProps = (dispatch) => ({
  getEnabledTokensList: (walletId) => dispatch(getEnabledTokens(walletId)),
  setEnabledTokensList: (walletId, enabledTokens) => dispatch(setEnabledTokens(walletId, enabledTokens))

})
export default connect(mapStateToProps, mapDispatchToProps)(ManageTokens)
