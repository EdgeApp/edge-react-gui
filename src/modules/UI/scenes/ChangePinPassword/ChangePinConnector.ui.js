import {connect} from 'react-redux'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import {Actions} from 'react-native-router-flux'
import ChangePinComponent from './ChangePinComponent.ui'

export const mapStateToProps = (state) => ({
  context: CORE_SELECTORS.getContext(state),
  account: CORE_SELECTORS.getAccount(state)
})

export const mapDispatchToProps = () => ({
  onComplete: Actions.pop
})

export default connect(mapStateToProps, mapDispatchToProps)(ChangePinComponent)
