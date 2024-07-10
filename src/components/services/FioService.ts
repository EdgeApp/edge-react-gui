import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { checkExpiredFioDomains } from '../../actions/FioActions'
import { useHandler } from '../../hooks/useHandler'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { FioDomain } from '../../types/types'
import { needToCheckExpired, refreshFioNames } from '../../util/FioAddressUtils'
import { makePeriodicTask } from '../../util/PeriodicTask'
import { showDevError } from './AirshipInstance'

const EXPIRE_CHECK_TIMEOUT = 30000

interface Props {
  navigation: NavigationBase
}

export const FioService = (props: Props) => {
  const { navigation } = props
  const dispatch = useDispatch()

  const expiredLastChecks = useSelector(state => state.ui.fio.expiredLastChecks)
  const expireReminderShown = useSelector(state => state.ui.fio.expireReminderShown)
  const expiredChecking = useSelector(state => state.ui.fio.expiredChecking)
  const walletsCheckedForExpired = useSelector(state => state.ui.fio.walletsCheckedForExpired)
  const fioWallets = useSelector(state => state.ui.wallets.fioWallets)

  const refreshNamesToCheckExpired = useHandler(async () => {
    if (expireReminderShown) return

    if (fioWallets.length === 0) {
      return
    }

    if (expiredChecking) return

    const walletsToCheck: EdgeCurrencyWallet[] = []
    for (const fioWallet of fioWallets) {
      if (!walletsCheckedForExpired[fioWallet.id]) {
        walletsToCheck.push(fioWallet)
      }
    }

    const namesToCheck: FioDomain[] = []
    const { fioDomains, fioWalletsById } = await refreshFioNames(walletsToCheck)
    for (const fioDomain of fioDomains) {
      if (needToCheckExpired(expiredLastChecks, fioDomain.name)) {
        namesToCheck.push(fioDomain)
      }
    }

    if (namesToCheck.length !== 0) {
      dispatch({ type: 'FIO/CHECKING_EXPIRED', data: true })
      await dispatch(checkExpiredFioDomains(navigation, namesToCheck, fioWalletsById))
    }
  })

  // Check for expired FIO domains
  React.useEffect(() => {
    const task = makePeriodicTask(refreshNamesToCheckExpired, EXPIRE_CHECK_TIMEOUT, {
      onError(e: unknown) {
        console.error('refreshNamesToCheckExpired error:', e)
        showDevError(e)
      }
    })
    task.start()

    return () => task.stop()
  }, [refreshNamesToCheckExpired])

  return null
}
