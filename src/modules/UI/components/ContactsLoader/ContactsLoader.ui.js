// @flow

import { Component } from 'react'

import type { GuiContact } from '../../../../types.js'
import { isAuthorized } from '../../permissions.js'
import type { PermissionStatus } from '../../permissions.js'

export type Props = {
  contactsPermission: PermissionStatus,
  loadContactsStart: () => void,
  fetchContacts: () => Promise<Array<GuiContact>>,
  loadContactsSuccess: (contacts: Array<GuiContact>) => void,
  loadContactsFail: (error: Error) => void
}

export class ContactsLoader extends Component<Props> {
  componentWillReceiveProps (nextProps: Props) {
    const { contactsPermission } = nextProps

    if (!isAuthorized(this.props.contactsPermission) && isAuthorized(contactsPermission)) {
      this.loadContacts()
    }
  }

  loadContacts = () => {
    this.props.loadContactsStart()
    return this.props
      .fetchContacts()
      .then(this.filterContacts)
      .then(this.sortContacts)
      .then(this.handleSuccess, this.handleFail)
  }

  filterContacts = (contacts: Array<GuiContact>) => {
    return contacts.filter(item => item.givenName)
  }

  sortContacts = (contacts: Array<GuiContact>): Array<GuiContact> => {
    return contacts.sort((a, b) => a.givenName.toUpperCase().localeCompare(b.givenName.toUpperCase()))
  }

  handleSuccess = (contacts: Array<GuiContact>) => {
    this.props.loadContactsSuccess(contacts)
  }

  handleFail = (error: Error) => {
    this.props.loadContactsFail(error)
  }

  render () {
    return null
  }
}
