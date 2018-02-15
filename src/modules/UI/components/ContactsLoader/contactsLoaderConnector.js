// @flow

import { connect } from 'react-redux'

import type { State, Dispatch } from '../../../ReduxTypes.js'

import { ContactsLoader } from './ContactsLoader.ui.js'
import { loadContactsRequest } from './indexContactsLoader.js'

export const mapStateToProps = (state: State) => ({
  contacts: state.contacts,
  contactsPermission: state.permissions.contacts
})
export const mapDispatchToProps = (dispatch: Dispatch) => ({
  loadContacts: () => dispatch(loadContactsRequest())
})

export default connect(mapStateToProps, mapDispatchToProps)(ContactsLoader)
