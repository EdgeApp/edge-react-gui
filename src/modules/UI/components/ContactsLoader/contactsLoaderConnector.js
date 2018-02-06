// @flow

import {connect} from 'react-redux'

import type {State, Dispatch} from '../../../ReduxTypes.js'

import {ContactsLoader} from './ContactsLoader.ui.js'
import {getContacts} from '../../../../reducers/contacts/indexContacts.js'
import {getContactsPermission} from '../../../../reducers/permissions/indexPermissions.js'
import {loadContactsRequest} from './indexContactsLoader.js'

export const mapStateToProps = (state: State) => ({
  contacts: getContacts(state),
  contactsPermission: getContactsPermission(state)
})
export const mapDispatchToProps = (dispatch: Dispatch) => ({
  loadContacts: () => dispatch(loadContactsRequest())
})

export default connect(mapStateToProps, mapDispatchToProps)(ContactsLoader)
