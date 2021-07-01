// @flow

import { type Disklet } from 'disklet'

export const sortUserNames = (coreUserNames: any, username: string): string[] =>
  coreUserNames.sort((a: string, b: string) => {
    const stringA = a.toUpperCase()
    const stringB = b.toUpperCase()
    if (stringA < stringB) {
      return -1
    }
    if (stringA > stringB) {
      return 1
    }
    return 0
  })

export const getRecentLoginUsernames = async (disklet: Disklet) => {
  const lastUsers = await disklet
    .getText('lastusers.json')
    .then(text => JSON.parse(text))
    .catch(_ => [])
  return lastUsers.slice(0, 4)
}

export const getRecentUserNames = (username: string, mostRecentUsernames: any, coreUsernames: any) => {
  const recentUsernames = []
  for (const username of mostRecentUsernames) {
    const index = coreUsernames.indexOf(username)
    if (index < 0) continue // Skip deleted & logged-in users
    coreUsernames.splice(index, 1)
    recentUsernames.push(username)
  }
  return recentUsernames
}

export const getCoreUserNames = (localUsers: any, username: string) => localUsers.map(userInfo => userInfo.username).filter(name => name !== username)
