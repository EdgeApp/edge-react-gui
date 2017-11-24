import React, {Component} from 'react'
import {
  View,
  FlatList
} from 'react-native'
import Text from '../../components/FormattedText'
import s from '../../../../locales/strings.js'
import Gradient from '../../components/Gradient/Gradient.ui'
import {connect} from 'react-redux'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import styles from './style.js'
import ManageTokenRow from './ManageTokenRow.ui.js'


class ManageTokens extends Component {
  constructor (props) {
    super(props)
    this.state = {
      metaTokens: props.guiWallet.metaTokens
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

  }

  render () {
    const {metaTokens} = this.props.guiWallet
    return (
      <View style={[styles.manageTokens]}>
        <Gradient style={styles.gradient} />
        <View style={styles.container}>
          {this.header()}
          <View style={styles.instructionalArea}>
            <Text style={styles.instructionalText}>{s.strings.managetokens_top_instructions}</Text>
          </View>
          <View style={styles.metaTokenListArea}>
            <FlatList
              data={metaTokens}
              renderItem={(metaToken) => <ManageTokenRow metaToken={metaToken} toggleToken={this.toggleToken} />}
            />
          </View>
          </View>
      </View>
    )
  }

  toggleToken = (currencyCode) => {
    console.log('do something with the token being toggled, currencyCode is: ', currencyCode)
  }
}


const mapStateToProps = (state) => ({
  context: CORE_SELECTORS.getContext(state),
  account: CORE_SELECTORS.getAccount(state)
})
const mapDispatchToProps = (dispatch) => ({
  dispatch
})

export default connect(mapStateToProps, mapDispatchToProps)(ManageTokens)
