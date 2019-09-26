// @flow

import { Component } from 'react'
import Contacts from 'react-native-contacts'
import { connect } from 'react-redux'

import { type PermissionStatus, PermissionStatusStrings } from '../../modules/PermissionsManager.js'
import type { Dispatch, State } from '../../types/reduxTypes.js'
import type { GuiContact } from '../../types/types.js'
import { showError } from '../services/AirshipInstance.js'

type Props = {
  contactsPermission: PermissionStatus,
  loadContactsSuccess: (contacts: Array<GuiContact>) => void
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
    givenName: 'Simplex',
    hasThumbnail: true,
    thumbnailPath: 'https://developer.edge.app/content/simplex.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  },
  {
    givenName: 'Wyre',
    hasThumbnail: true,
    thumbnailPath: 'https://developer.edge.app/content/wyre.png',
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
  },
  {
    givenName: 'Fox Exchange',
    hasThumbnail: true,
    thumbnailPath: 'https://developer.edge.app/content/foxEchange.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  },
  {
    givenName: 'Coinswitch',
    hasThumbnail: true,
    thumbnailPath: 'https://developer.edge.app/content/coinswitch.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  },
  {
    givenName: 'Bits of Gold',
    hasThumbnail: true,
    thumbnailPath: 'https://developer.edge.app/content/bits-of-gold-logo.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  },
  {
    givenName: 'Totle',
    hasThumbnail: true,
    thumbnailPath: 'https://developer.edge.app/content/totle-logo.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  },
  {
    givenName: 'ChangeHero',
    hasThumbnail: true,
    thumbnailPath: 'https://developer.edge.app/content/changehero.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  }
]

class ContactsLoaderComponent extends Component<Props> {
  UNSAFE_componentWillReceiveProps (nextProps: Props) {
    const { contactsPermission } = nextProps

    if (this.props.contactsPermission !== PermissionStatusStrings.AUTHORIZED && contactsPermission === PermissionStatusStrings.AUTHORIZED) {
      this.loadContacts()
    }
  }

  fetchContacts (): Promise<Array<GuiContact>> {
    return new Promise((resolve, reject) => {
      return Contacts.getAll((error, result) => {
        // The native code sometimes sends strings instead of errors:
        if (error) return reject(typeof error === 'string' ? new Error(error) : error)
        return resolve(result)
      })
    })
  }

  loadContacts = () => {
    return this.fetchContacts()
      .catch(error => {
        showError(error)
        return []
      })
      .then(contacts => {
        const cleanContacts = contacts
          .filter(item => item.givenName)
          .concat(merchantPartners)
          .sort((a, b) => a.givenName.toUpperCase().localeCompare(b.givenName.toUpperCase()))

        this.props.loadContactsSuccess(cleanContacts)
      })
  }

  render () {
    return null
  }
}

export const ContactsLoader = connect(
  (state: State) => ({
    contactsPermission: state.permissions.contacts
  }),
  (dispatch: Dispatch) => ({
    loadContactsSuccess: (contacts: Array<GuiContact>) =>
      dispatch({
        type: 'CONTACTS/LOAD_CONTACTS_SUCCESS',
        data: { contacts }
      })
  })
)(ContactsLoaderComponent)
