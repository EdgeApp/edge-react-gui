import { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { showFioExpiredModal } from '../../actions/FioActions'
import { FIO_WALLET_TYPE } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { FioDomain } from '../../types/types'
import {
  getExpiredSoonFioDomains,
  getFioExpiredCheckFromDisklet,
  needToCheckExpired,
  refreshFioNames,
  setFioExpiredCheckToDisklet
} from '../../util/FioAddressUtils'
import { makePeriodicTask } from '../../util/PeriodicTask'
import { showDevError } from './AirshipInstance'

const EXPIRE_CHECK_TIMEOUT = 30000

interface Props {
  account: EdgeAccount
  navigation: NavigationBase
}

export const FioService = (props: Props) => {
  const { account, navigation } = props
  const dispatch = useDispatch()

  const currencyWallets = useWatch(account, 'currencyWallets')
  const expiredLastChecks = React.useRef<{ [fioName: string]: Date } | undefined>()
  const expireReminderShown = React.useRef(false)
  const expiredChecking = React.useRef(false)
  const walletsCheckedForExpired = React.useRef<{ [walletId: string]: boolean }>({})
  const fioWallets = React.useRef<EdgeCurrencyWallet[]>([])
  const disklet = useSelector(state => state.core.disklet)

  React.useEffect(() => {
    const fioWalletsTemp: EdgeCurrencyWallet[] = []
    for (const walletId of Object.keys(currencyWallets)) {
      if (currencyWallets[walletId].type === FIO_WALLET_TYPE) {
        fioWalletsTemp.push(currencyWallets[walletId])
      }
    }

    if (!arraysEqual(fioWalletsTemp, fioWallets.current)) {
      fioWallets.current = fioWalletsTemp
      dispatch({
        type: 'UPDATE_FIO_WALLETS',
        data: { fioWallets: fioWallets.current }
      })
    }
  }, [currencyWallets, dispatch])

  const refreshNamesToCheckExpired = useHandler(async () => {
    if (expireReminderShown.current) return

    if (fioWallets.current.length === 0) {
      return
    }

    if (expiredChecking.current) return
    expiredChecking.current = true

    const walletsToCheck: EdgeCurrencyWallet[] = []
    for (const fioWallet of fioWallets.current) {
      if (!walletsCheckedForExpired.current[fioWallet.id]) {
        walletsToCheck.push(fioWallet)
      }
    }

    const namesToCheck: FioDomain[] = []
    const { fioDomains, fioWalletsById } = await refreshFioNames(walletsToCheck)
    if (expiredLastChecks.current == null) {
      expiredLastChecks.current = await getFioExpiredCheckFromDisklet(disklet)
    }
    for (const fioDomain of fioDomains) {
      if (needToCheckExpired(expiredLastChecks.current, fioDomain.name)) {
        namesToCheck.push(fioDomain)
      }
    }

    if (namesToCheck.length !== 0) {
      const expired: FioDomain[] = getExpiredSoonFioDomains(fioDomains)
      if (expired.length > 0) {
        const first: FioDomain = expired[0]
        const fioWallet: EdgeCurrencyWallet = fioWalletsById[first.walletId]
        await showFioExpiredModal(navigation, fioWallet, first)
        expireReminderShown.current = true

        expiredLastChecks.current[first.name] = new Date()
        await setFioExpiredCheckToDisklet(expiredLastChecks.current, disklet)
      }

      for (const walletId in fioWalletsById) {
        walletsCheckedForExpired.current[walletId] = true
      }

      expiredChecking.current = false
    }
  })

  // Check for expired FIO domains
  useAsyncEffect(
    async () => {
      await account.waitForAllWallets()
      const task = makePeriodicTask(refreshNamesToCheckExpired, EXPIRE_CHECK_TIMEOUT, {
        onError(e: unknown) {
          console.error('refreshNamesToCheckExpired error:', e)
          showDevError(e)
        }
      })
      task.start()

      return () => task.stop()
    },
    [refreshNamesToCheckExpired],
    'FioService:checkExpired'
  )

  return null
}

function arraysEqual(arr1: EdgeCurrencyWallet[], arr2: EdgeCurrencyWallet[]) {
  if (arr1.length !== arr2.length) return false

  arr1.sort((a, b) => a.id.localeCompare(b.id))
  arr2.sort((a, b) => a.id.localeCompare(b.id))

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i].id !== arr2[i].id) return false
  }

  return true
}
