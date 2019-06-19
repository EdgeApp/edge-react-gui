// @flow

import { connect } from 'react-redux'

import type { GuiContact } from '../../../../types.js'
import type { Dispatch, State } from '../../../ReduxTypes.js'
import { displayErrorAlert } from '../ErrorAlert/actions.js'
import { fetchContacts } from './actions.js'
import { ContactsLoader } from './ContactsLoader.ui.js'

export const mapStateToProps = (state: State) => ({
  contactsPermission: state.permissions.contacts
})
export const mapDispatchToProps = (dispatch: Dispatch) => ({
  fetchContacts,
  loadContactsSuccess: (contacts: Array<GuiContact>) =>
    dispatch({
      type: 'CONTACTS/LOAD_CONTACTS_SUCCESS',
      data: { contacts }
    }),
  loadContactsFail: (error: Error) => {
    console.log(error)
    dispatch(displayErrorAlert(error.message))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ContactsLoader)
