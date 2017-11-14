import {connect} from 'react-redux'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import {Actions} from 'react-native-router-flux'
import ChangePasswordComponent from './ChangePasswordComponent.ui'

export const mapStateToProps = (state) => ({
  context: CORE_SELECTORS.getContext(state),
  account: CORE_SELECTORS.getAccount(state),
  showHeader: false
})

export const mapDispatchToProps = () => ({
  onComplete: Actions.pop
})

export default connect(mapStateToProps, mapDispatchToProps)(ChangePasswordComponent)
