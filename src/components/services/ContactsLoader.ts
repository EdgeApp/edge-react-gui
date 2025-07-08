import * as React from 'react'
import Contacts from 'react-native-contacts'
import { sprintf } from 'sprintf-js'

import { EDGE_CONTENT_SERVER_URI } from '../../constants/CdnConstants'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { GuiContact } from '../../types/types'
import { showError } from '../services/AirshipInstance'

const merchantPartners: GuiContact[] = [
  {
    givenName: '0x Gasless Swap',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: '0xgasless.png'
  },
  {
    givenName: 'Bitrefill',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'bitrefill.png'
  },
  {
    givenName: 'Bits of Gold',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'bits-of-gold-logo.png'
  },
  {
    givenName: 'Change NOW',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'changenow.png'
  },
  {
    givenName: 'ChangeHero',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'changehero.png'
  },
  {
    givenName: 'Changelly',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'changelly.png'
  },
  {
    givenName: 'IBC Transfer',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'cosmosibc.png'
  },
  {
    givenName: 'Fantom/Sonic Bridge',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'fantomsonicupgrade.png'
  },
  {
    givenName: 'EOS Network',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'eos-logo-solo-64.png'
  },
  {
    givenName: 'Exolix',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'exolix-logo.png'
  },
  {
    givenName: 'Fox Exchange',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'foxEchange.png'
  },
  {
    givenName: 'Godex',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'godex.png'
  },
  {
    givenName: 'LetsExchange',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'letsexchange-logo.png'
  },
  {
    givenName: 'LI.FI',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'lifi.png'
  },
  {
    givenName: 'ShapeShift',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'shapeshift.png'
  },
  {
    givenName: 'SideShift.ai',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'sideshift-logo.png'
  },
  {
    givenName: 'Simplex',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'simplex.png'
  },
  {
    givenName: 'Swapuz',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'swapuz.png'
  },
  {
    givenName: 'Switchain',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'switchain.png'
  },
  {
    givenName: 'Maya Protocol',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'mayaprotocol.png'
  },
  {
    givenName: 'Thorchain',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'thorchain.png'
  },
  {
    givenName: 'Thorchain DEX Aggregator',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'thorchain.png'
  },
  {
    givenName: 'Totle',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'totle-logo.png'
  },
  {
    givenName: 'Unizen',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'unizen.png'
  },
  {
    givenName: 'Velodrome',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'velodrome.png'
  },
  {
    givenName: 'Visa® Prepaid Card',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'visa.png'
  },
  {
    givenName: 'Wyre',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'wyre.png'
  },
  {
    givenName: 'XRP DEX',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'xrpdex.png'
  },
  {
    givenName: 'Rango Exchange',
    familyName: '',
    hasThumbnail: true,
    thumbnailPath: 'rango.png'
  }
]

export function ContactsLoader(props: {}) {
  const contactsPermission = useSelector(state => state.permissions.contacts)
  const dispatch = useDispatch()

  React.useEffect(() => {
    const loadContacts = async () => {
      const allContacts: GuiContact[] = merchantPartners.map(contact => ({
        ...contact,
        thumbnailPath: `${EDGE_CONTENT_SERVER_URI}/${contact.thumbnailPath}`
      }))

      // Load phone contacts and add to GUI contacts:
      if (
        contactsPermission === 'granted' ||
        contactsPermission === 'limited'
      ) {
        const contacts = await Contacts.getAll()
        for (const contact of contacts) {
          const { givenName } = contact
          if (givenName != null) {
            allContacts.push({ ...contact, givenName })
          }
        }
      }

      // Save to redux:
      allContacts.sort((a, b) =>
        a.givenName.toUpperCase().localeCompare(b.givenName.toUpperCase())
      )
      dispatch({
        type: 'CONTACTS/LOAD_CONTACTS_SUCCESS',
        data: { contacts: allContacts }
      })
    }

    loadContacts().catch(error => {
      showError(sprintf(lstrings.contacts_load_failed_message_s, String(error)))
    })
  }, [contactsPermission, dispatch])

  return null
}
