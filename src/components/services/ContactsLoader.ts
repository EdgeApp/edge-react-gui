import * as React from 'react'
import Contacts from 'react-native-contacts'
import { PermissionStatus } from 'react-native-permissions'
import { sprintf } from 'sprintf-js'

import { EDGE_CONTENT_SERVER_URI } from '../../constants/CdnConstants'
import { lstrings } from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { GuiContact } from '../../types/types'
import { showError } from '../services/AirshipInstance'
interface StateProps {
  contactsPermission: PermissionStatus
}
interface DispatchProps {
  loadContactsSuccess: (contacts: GuiContact[]) => void
}
type Props = StateProps & DispatchProps

const merchantPartners = [
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
    givenName: 'ChangeHero',
    hasThumbnail: true,
    thumbnailPath: 'changehero.png',
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
    givenName: 'LetsExchange',
    hasThumbnail: true,
    thumbnailPath: 'letsexchange-logo.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  },
  {
    givenName: 'LI.FI',
    hasThumbnail: true,
    thumbnailPath: 'lifi.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  },
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
    givenName: 'Swapuz',
    hasThumbnail: true,
    thumbnailPath: 'swapuz.png',
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
    givenName: 'Thorchain',
    hasThumbnail: true,
    thumbnailPath: 'thorchain.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  },
  {
    givenName: 'Thorchain DEX Aggregator',
    hasThumbnail: true,
    thumbnailPath: 'thorchain.png',
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
    givenName: 'Velodrome',
    hasThumbnail: true,
    thumbnailPath: 'velodrome.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  },
  {
    givenName: 'Visa® Prepaid Card',
    hasThumbnail: true,
    thumbnailPath: 'visa.png',
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
    givenName: 'XRP DEX',
    hasThumbnail: true,
    thumbnailPath: 'xrpdex.png',
    emailAddresses: [],
    postalAddresses: [],
    middleName: '',
    company: '',
    jobTitle: '',
    familyName: '',
    recordID: ''
  }
].map(({ thumbnailPath, ...rest }) => ({ ...rest, thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/${thumbnailPath}` }))

class ContactsLoaderComponent extends React.Component<Props> {
  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    const { contactsPermission } = nextProps

    if (this.props.contactsPermission !== 'granted' && contactsPermission === 'granted') {
      this.loadContacts().catch(err => {
        console.warn(err)
        showError(sprintf(lstrings.contacts_load_failed_message_s))
      })
    }
  }

  loadContacts = async () => {
    return await Contacts.getAll()
      .then(contacts => {
        const cleanContacts = contacts
          .filter(item => item.givenName)
          // @ts-expect-error
          .concat(merchantPartners)
          .sort((a, b) => a.givenName.toUpperCase().localeCompare(b.givenName.toUpperCase()))

        // @ts-expect-error
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
