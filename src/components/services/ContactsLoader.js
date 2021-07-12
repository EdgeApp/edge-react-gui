// @flow

import * as React from 'react'
import Contacts from 'react-native-contacts'
import RNPermissions from 'react-native-permissions'

import { type PermissionStatus } from '../../reducers/PermissionsReducer.js'
import { connect } from '../../types/reactRedux.js'
import type { GuiContact } from '../../types/types.js'
import { showError } from '../services/AirshipInstance.js'

type StateProps = {
  contactsPermission: PermissionStatus
}
type DispatchProps = {
  loadContactsSuccess: (contacts: GuiContact[]) => void
}
type Props = StateProps & DispatchProps

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
    givenName: 'Switchain',
    hasThumbnail: true,
    thumbnailPath: 'https://developer.edge.app/content/switchain.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  },
  {
    givenName: 'SideShift.ai',
    hasThumbnail: true,
    thumbnailPath: 'https://developer.edge.app/content/sideshift-logo.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  }
]

class ContactsLoaderComponent extends React.Component<Props> {
  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    const { contactsPermission } = nextProps

    if (this.props.contactsPermission !== RNPermissions.RESULTS.GRANTED && contactsPermission === RNPermissions.RESULTS.GRANTED) {
      this.loadContacts()
    }
  }

  loadContacts = () => {
    return Contacts.getAll()
      .then(contacts => {
        const cleanContacts = contacts
          .filter(item => item.givenName)
          .concat(merchantPartners)
          .sort((a, b) => a.givenName.toUpperCase().localeCompare(b.givenName.toUpperCase()))

        this.props.loadContactsSuccess(cleanContacts)
      })
      .catch(error => {
        showError(error)
        return []
      })
  }

  render() {
    return null
  }
}

export const ContactsLoader = connect<StateProps, DispatchProps, {}>(
  state => ({
    contactsPermission: state.permissions.contacts
  }),
  dispatch => ({
    loadContactsSuccess(contacts: GuiContact[]) {
      dispatch({
        type: 'CONTACTS/LOAD_CONTACTS_SUCCESS',
        data: { contacts }
      })
    }
  })
)(ContactsLoaderComponent)
