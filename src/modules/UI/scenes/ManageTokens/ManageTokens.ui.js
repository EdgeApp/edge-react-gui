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


class ManageTokens extends Component {
  constructor (props) {
    super(props)
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
          <View style={[styles.metaTokenListArea, UTILS.border()]}>
            <View style={[styles.metaTokenListWrap]}>
              <FlatList
                data={metaTokens}
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


const mapStateToProps = (state) => ({
  context: CORE_SELECTORS.getContext(state),
  account: CORE_SELECTORS.getAccount(state)
})
const mapDispatchToProps = (dispatch) => ({
  dispatch
})

export default connect(mapStateToProps, mapDispatchToProps)(ManageTokens)
