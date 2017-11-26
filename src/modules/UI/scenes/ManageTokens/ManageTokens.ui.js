import React, {Component} from 'react'
import {
  View,
  FlatList
} from 'react-native'
import Text from '../../components/FormattedText'
import s from '../../../../locales/strings.js'
import Gradient from '../../components/Gradient/Gradient.ui'
import {Actions} from 'react-native-router-flux'
import {connect} from 'react-redux'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
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

  componentDidMount () {
    let enabledTokens = []
    const { id } = this.props.guiWallet
    const walletEnabledTokens = this.props.getEnabledTokensList(id)
    for (let prop in walletEnabledTokens) {
      let tokenValues = walletEnabledTokens[prop]
      enabledTokens.push(tokenValues)
    }
    let sortedEnabledTokens = enabledTokens.sort((a, b) => {
      return a.currencyCode - b.currencyCode
    })
    this.setState({
      enabledTokens: sortedEnabledTokens
    })
  }

  toggleToken = (currencyCode) => {
    let enabledTokens = []
    const { id } = this.props.guiWallet
    const walletEnabledTokens = this.props.getEnabledTokensList(id)
    for (let prop in walletEnabledTokens) {
      if (prop === currencyCode) {
        walletEnabledTokens[prop].enabled = !walletEnabledTokens[prop].enabled
      }
      let tokenValues = walletEnabledTokens[prop]
      enabledTokens.push(tokenValues)
    }
    let sortedEnabledTokens = enabledTokens.sort((a, b) => {
      return a.currencyCode - b.currencyCode
    })
    this.setState({
      enabledTokens: sortedEnabledTokens
    })
  }

  saveEnabledTokenList = () => {
    const { id } = this.props.guiWallet
    const walletEnabledTokens = this.props.getEnabledTokensList(id)
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
                style={styles.addButton}
                text={'Add'}
                onPressFunction={this.goToAddTokenScene}
              />
              <PrimaryButton
                text={'Save'}
                style={styles.saveButton}
                onPressFunction={this.saveEnabledTokenList}
              />
            </View>
          </View>
        </View>
      </View>
    )
  }

  goToAddTokenScene = () => {
    const { id } = this.props.guiWallet
    Actions.addToken({walletId: id})
  }
}

const mapStateToProps = (state: ReduxState, ownProps: InternalProps): InternalProps => {

  return {

  }
}
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  getEnabledTokensList: (walletId) => dispatch(getEnabledTokens(walletId)),
  setEnabledTokensList: (walletId, enabledTokens) => dispatch(setEnabledTokens(walletId, enabledTokens))

})
export default connect(mapStateToProps, mapDispatchToProps)(ManageTokens)
