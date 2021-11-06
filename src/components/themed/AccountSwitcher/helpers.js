// @flow

import { type Disklet } from 'disklet'
import { type EdgeUserInfo } from 'edge-core-js'

export const sortUserNames = (coreUserNames: string[], username: string): string[] =>
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

export const getRecentLoginUsernames = async (disklet: Disklet): Promise<string[]> => {
  const lastUsers = await disklet
    .getText('lastusers.json')
    .then(text => JSON.parse(text))
    .catch(_ => [])
  return lastUsers.slice(0, 4)
}

export const getRecentUserNames = (username: string, mostRecentUsernames: string[], coreUsernames: string[]): string[] => {
  const recentUsernames = []
  for (const username of mostRecentUsernames) {
    const index = coreUsernames.indexOf(username)
    if (index < 0) continue // Skip deleted & logged-in users
    coreUsernames.splice(index, 1)
    recentUsernames.push(username)
  }
  return recentUsernames
}

export const getCoreUserNames = (localUsers: EdgeUserInfo[], username: string): string[] =>
  localUsers.map(({ username }: EdgeUserInfo) => username).filter(name => name !== username)
