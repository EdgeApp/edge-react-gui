// @flow

import * as React from 'react'
import Contacts from 'react-native-contacts'
import RNPermissions from 'react-native-permissions'

import { EDGE_CONTENT_SERVER } from '../../constants/WalletAndCurrencyConstants.js'
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
    thumbnailPath: 'shapeshift.png',
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
    thumbnailPath: 'changelly.png',
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
    thumbnailPath: 'eos-logo-solo-64.png',
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
    thumbnailPath: 'changenow.png',
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
    thumbnailPath: 'simplex.png',
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
    thumbnailPath: 'wyre.png',
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
    thumbnailPath: 'bitrefill.png',
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
    thumbnailPath: 'godex.png',
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
    thumbnailPath: 'foxEchange.png',
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
    thumbnailPath: 'bits-of-gold-logo.png',
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
    thumbnailPath: 'totle-logo.png',
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
    thumbnailPath: 'switchain.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  },
  {
    givenName: 'Exolix',
    hasThumbnail: true,
    thumbnailPath: 'exolix-logo.png',
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
    thumbnailPath: 'sideshift-logo.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  }
].map(({ thumbnailPath, ...rest }) => ({ ...rest, thumbnailPath: `${EDGE_CONTENT_SERVER}/${thumbnailPath}` }))

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
