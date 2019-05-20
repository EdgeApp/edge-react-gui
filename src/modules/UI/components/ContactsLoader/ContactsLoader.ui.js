// @flow

import { Component } from 'react'

import type { GuiContact } from '../../../../types.js'
import { type PermissionStatus, PermissionStatusStrings } from '../../../PermissionsManager.js'

export type Props = {
  contactsPermission: PermissionStatus,
  loadContactsStart: () => void,
  fetchContacts: () => Promise<Array<GuiContact>>,
  loadContactsSuccess: (contacts: Array<GuiContact>) => void,
  loadContactsFail: (error: Error) => void
}

const merchantPartners = [
  {
    givenName: 'ShapeShift',
    hasThumbnail: true,
    thumbnailPath: 'https://developer.edge.app/content/shapeshift.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  },
  {
    givenName: 'Changelly',
    hasThumbnail: true,
    thumbnailPath: 'https://developer.edge.app/content/changelly.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  },
  {
    givenName: 'EOS Network',
    hasThumbnail: true,
    thumbnailPath: 'https://developer.edge.app/content/eos-logo-solo-64.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  },
  {
    givenName: 'Change NOW',
    hasThumbnail: true,
    thumbnailPath: 'https://developer.edge.app/content/changenow.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  },
  {
    givenName: 'Faa.st',
    hasThumbnail: true,
    thumbnailPath: 'https://developer.edge.app/content/faast.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  },
  {
    givenName: 'Bitrefill',
    hasThumbnail: true,
    thumbnailPath: 'https://developer.edge.app/content/bitrefill.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  },
  {
    givenName: 'Godex',
    hasThumbnail: true,
    thumbnailPath: 'https://developer.edge.app/content/godex.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  }
]

export class ContactsLoader extends Component<Props> {
  UNSAFE_componentWillReceiveProps (nextProps: Props) {
    const { contactsPermission } = nextProps

    if (this.props.contactsPermission !== PermissionStatusStrings.AUTHORIZED && contactsPermission === PermissionStatusStrings.AUTHORIZED) {
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
    return contacts.filter(item => item.givenName).concat(merchantPartners)
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
