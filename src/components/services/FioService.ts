import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { showFioExpiredModal } from '../../actions/FioActions'
import { useHandler } from '../../hooks/useHandler'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { FioDomain } from '../../types/types'
import { getExpiredSoonFioDomains, needToCheckExpired, refreshFioNames, setFioExpiredCheckToDisklet } from '../../util/FioAddressUtils'
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
  const disklet = useSelector(state => state.core.disklet)

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

      const expired: FioDomain[] = getExpiredSoonFioDomains(fioDomains)
      if (expired.length > 0) {
        const first: FioDomain = expired[0]
        const fioWallet: EdgeCurrencyWallet = fioWalletsById[first.walletId]
        await showFioExpiredModal(navigation, fioWallet, first)

        expiredLastChecks[first.name] = new Date()
        dispatch({ type: 'FIO/SET_LAST_EXPIRED_CHECKS', data: expiredLastChecks })
        // @ts-expect-error
        dispatch({ type: 'FIO/EXPIRED_REMINDER_SHOWN', data: true })
        await setFioExpiredCheckToDisklet(expiredLastChecks, disklet)
      }

      for (const walletId in fioWalletsById) {
        walletsCheckedForExpired[walletId] = true
      }
      dispatch({ type: 'FIO/WALLETS_CHECKED_FOR_EXPIRED', data: walletsCheckedForExpired })

      dispatch({ type: 'FIO/CHECKING_EXPIRED', data: false })
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
