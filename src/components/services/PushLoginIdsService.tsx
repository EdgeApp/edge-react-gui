import type { EdgeContext } from 'edge-core-js'
import type * as React from 'react'

import { syncPushLoginIds } from '../../actions/NotificationActions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useWatch } from '../../hooks/useWatch'

interface Props {
  context: EdgeContext
}

/**
 * Keeps the push server's logins for this device in step with the accounts
 * saved on it, so a forgotten account stops getting login approval pushes.
 *
 * This lives above the navigator because accounts can be forgotten from the
 * login scene, with nobody logged in. It also syncs on mount, so a forget that
 * could not reach the server gets another chance at the next launch.
 */
export const PushLoginIdsService: React.FC<Props> = props => {
  const { context } = props
  const localUsers = useWatch(context, 'localUsers')

  // Any stash update fires the watcher, so only the set of logins is a change:
  const loginIds = localUsers
    .map(user => user.loginId)
    .sort((a, b) => a.localeCompare(b))
    .join()

  useAsyncEffect(
    async () => {
      await syncPushLoginIds(context).catch((error: unknown) => {
        console.warn('PushLoginIdsService:', error)
      })
    },
    [context, loginIds],
    'PushLoginIdsService'
  )

  return null
}
