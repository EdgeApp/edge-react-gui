import * as React from 'react'

import { FundAccountModal } from '../components/modals/FundAccountModal'
import { Airship } from '../components/services/AirshipInstance'
import { NavigationBase } from '../types/routerTypes'

export const DEEPLINK_MODAL_FNS = {
  fundAccount: launchFundAccountModal,
  test: () => {
    console.debug('Test modal deeplink success')
  }
}

async function launchFundAccountModal(navigation: NavigationBase): Promise<void> {
  Airship.show(bridge => <FundAccountModal bridge={bridge} navigation={navigation} />).catch(() => {})
}
