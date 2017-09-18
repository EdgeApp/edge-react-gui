import {connect} from 'react-redux'
import UserList from './UserList'
import {logoutRequest} from '../../../../Login/action'

import * as CORE_SELECTORS from '../../../../Core/selectors.js'
import * as CONTEXT_API from '../../../../Core/Context/api.js'

const mapStateToProps = (state) => ({
  usernames: CORE_SELECTORS.getUsernames(state)
})
const mapDispatchToProps = (dispatch) => ({
  logout: (username) => dispatch(logoutRequest(username)),
  deleteLocalAccount: (username) => dispatch(CONTEXT_API.deleteLocalAccount(username))
})

export default connect(mapStateToProps, mapDispatchToProps)(UserList)
