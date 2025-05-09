import { EdgeAccount, EdgeUserInfo } from 'edge-core-js'

/**
 * Given a list of users from the core,
 * remove the given user, then organize the 3 most recent users,
 * followed by the rest in alphabetical order.
 */
export function arrangeUsers(localUsers: EdgeUserInfo[], activeAccount: EdgeAccount): EdgeUserInfo[] {
  // Sort the users according to their last login date (excluding active logged in user):
  const inactiveUsers = localUsers
    .filter(info => info.loginId !== activeAccount.rootLoginId)
    .sort((a, b) => {
      const { lastLogin: aDate = new Date(0) } = a
      const { lastLogin: bDate = new Date(0) } = b
      return bDate.valueOf() - aDate.valueOf()
    })

  // Get the most recent 3 users that were logged in
  const recentUsers = inactiveUsers.slice(0, 3)

  // Sort everything after the last 3 entries alphabetically:
  const oldUsers = inactiveUsers.slice(3).sort((a, b) => {
    const stringA = a.username?.toLowerCase() ?? ''
    const stringB = b.username?.toLowerCase() ?? ''
    if (stringA < stringB) return -1
    if (stringA > stringB) return 1
    return 0
  })

  return [...recentUsers, ...oldUsers]
}
