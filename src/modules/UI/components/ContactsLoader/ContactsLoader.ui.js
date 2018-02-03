// @flow

import {Component} from 'react'

import {isAuthorized} from '../../permissions.js'

import type {PermissionStatus} from '../../permissions.js'
import type {GuiContact} from '../../../../types.js'

export type Props = {
  contactsPermission: PermissionStatus,
  contacts: Array<GuiContact>,
  loadContacts: () => void
}
export type State = {}

export class ContactsLoader extends Component<Props, State> {
  componentWillReceiveProps (nextProps: Props) {
    const {
      contacts,
      contactsPermission
    } = nextProps

    if (!contacts && isAuthorized(contactsPermission)) {
      this.props.loadContacts()
    }
  }

  render () {
    return null
  }
}
